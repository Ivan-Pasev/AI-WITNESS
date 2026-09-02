import { mkdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import type { PrivateKey } from "@hiero-ledger/sdk";

import {
  BASE_STATE,
  buildPreExecutionCase,
  CASE_DEFINITIONS,
} from "../demo/cases/build-case.ts";
import {
  compareActionManifests,
  stateHash,
} from "../demo/cases/compare-action.ts";
import type { DemoCaseDefinition } from "../demo/cases/types.ts";
import { executeBlocked } from "../demo/executors/blocked-executor.ts";
import { executeDivergentAppend } from "../demo/executors/divergent-executor.ts";
import { executeExactAppend } from "../demo/executors/exact-executor.ts";
import type { ExecutionResult } from "../demo/executors/types.ts";
import {
  buildAnchorPayload,
  calculatePublicManifestHash,
  submitAnchor,
} from "../src/hedera/anchor.ts";
import {
  createTestnetClient,
  loadHederaRuntimeConfig,
  parsePrivateKey,
} from "../src/hedera/client.ts";
import { createControlledTopic } from "../src/hedera/create-topic.ts";
import {
  mirrorMessagePath,
  waitForMirrorMessage,
} from "../src/hedera/mirror-query.ts";
import type { PublicAnchorPayload } from "../src/hedera/types.ts";
import { verifyMirrorAnchor } from "../src/hedera/verify-anchor.ts";
import { createReceipt } from "../src/protocol/create-receipt.ts";
import type { JsonObject, ReceiptEnvelope } from "../src/protocol/types.ts";

const OUTPUT_DIR = "phase5-output";
const PROFILE = "IRP-1-HEDERA-TESTNET-P5-A-v1" as const;

function isoAt(milliseconds: number): string {
  return new Date(milliseconds).toISOString();
}

function makeRuntimeDefinition(
  definition: DemoCaseDefinition,
  runId: string,
): DemoCaseDefinition {
  const base = Date.now();
  return {
    ...definition,
    sessionId: `p5-${definition.slug}-${runId}`,
    receiptIds: [
      `p5-${runId}-w0`,
      `p5-${runId}-w1`,
      `p5-${runId}-w2`,
      `p5-${runId}-w3`,
    ],
    nonces: [
      `p5-${runId}-n0`,
      `p5-${runId}-n1`,
      `p5-${runId}-n2`,
      `p5-${runId}-n3`,
    ],
    createdAt: [isoAt(base), isoAt(base + 1), isoAt(base + 2), isoAt(base + 3)],
  };
}

function executeCase(definition: DemoCaseDefinition): ExecutionResult {
  const state = { files: { ...BASE_STATE.files } };
  if (definition.mode === "MATCH") {
    return executeExactAppend(state, definition.targetPath, definition.appendText);
  }
  if (definition.mode === "BLOCK") {
    return executeBlocked(state);
  }
  return executeDivergentAppend(
    state,
    definition.targetPath,
    definition.appendText,
    "demo/adversarial-extra.md",
    definition.extraText!,
  );
}

function publicManifest(
  definition: DemoCaseDefinition,
  receipt: ReceiptEnvelope,
): JsonObject {
  return {
    profile: PROFILE,
    caseId: definition.id,
    baselineCaseSlug: definition.slug,
    anchorStage: receipt.receiptKind,
    receiptId: receipt.receiptId,
    receiptHash: receipt.receiptHash,
    previousReceiptHash: receipt.previousReceiptHash!,
    disclosure: "PUBLIC_MINIMIZED_COMMITMENT",
  };
}

async function anchorAndVerify(
  client: Parameters<typeof submitAnchor>[0],
  topicId: string,
  submitKey: PrivateKey,
  mirrorBase: string,
  payload: PublicAnchorPayload,
): Promise<{
  sequenceNumber: number;
  consensusTimestamp: string;
  mirrorPath: string;
  verificationVerdict: "ANCHORED";
}> {
  const submitted = await submitAnchor(client, topicId, submitKey, payload);
  const mirrored = await waitForMirrorMessage(
    mirrorBase,
    submitted.topicId,
    submitted.sequenceNumber,
  );
  const verification = verifyMirrorAnchor(
    submitted.topicId,
    submitted.sequenceNumber,
    payload,
    mirrored,
  );
  if (verification.verdict !== "ANCHORED" || !verification.consensusTimestamp) {
    throw new Error(
      `HOLD_ANCHOR_PAYLOAD_MISMATCH: ${verification.verdict} ${verification.issues.join("; ")}`,
    );
  }
  return {
    sequenceNumber: submitted.sequenceNumber,
    consensusTimestamp: verification.consensusTimestamp,
    mirrorPath: mirrorMessagePath(submitted.topicId, submitted.sequenceNumber),
    verificationVerdict: "ANCHORED",
  };
}

function createOutcomeReceipt(
  definition: DemoCaseDefinition,
  w2: ReceiptEnvelope,
  execution: ExecutionResult,
  authorizedManifest: JsonObject,
  executionObservedAt: string,
): ReceiptEnvelope {
  const correspondence = compareActionManifests(
    authorizedManifest,
    execution.actualActionManifest,
    execution.executionState,
  );
  const violations: JsonObject[] =
    definition.mode === "DIVERGE"
      ? [{ code: "UNAUTHORIZED_EXTRA_PATH", path: "demo/adversarial-extra.md" }]
      : [];
  return createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W3_OUTCOME",
    receiptId: definition.receiptIds[3],
    sessionId: definition.sessionId,
    nonce: definition.nonces[3],
    createdAt: executionObservedAt,
    previousReceiptHash: w2.receiptHash,
    payload: {
      authorizationReceiptHash: w2.receiptHash,
      executionState: execution.executionState,
      actualActionManifest: execution.actualActionManifest,
      observedResult: {
        beforeStateHash: stateHash({ files: { ...BASE_STATE.files } }),
        afterStateHash: stateHash(execution.state),
        mutated:
          stateHash({ files: { ...BASE_STATE.files } }) !== stateHash(execution.state),
        executionObservedAt,
      },
      correspondenceVerdict: correspondence,
      violations,
      residualUnknowns: [
        "semantic correctness remains outside IRP-1",
        "local execution timestamp is not a Hedera consensus timestamp",
      ],
    },
  });
}

async function runCase(
  slug: string,
  client: Parameters<typeof submitAnchor>[0],
  topicId: string,
  submitKey: PrivateKey,
  mirrorBase: string,
): Promise<JsonObject> {
  const baseline = CASE_DEFINITIONS[slug];
  if (!baseline) throw new Error(`Unknown Phase-4 case slug: ${slug}`);
  const runId = randomUUID().replaceAll("-", "");
  const definition = makeRuntimeDefinition(baseline, runId);
  const pre = buildPreExecutionCase(definition);

  const w2Manifest = publicManifest(definition, pre.w2);
  const w2Payload = buildAnchorPayload(pre.w2, w2Manifest);
  const w2Evidence = await anchorAndVerify(
    client,
    topicId,
    submitKey,
    mirrorBase,
    w2Payload,
  );

  // Execution is deliberately impossible before the awaited W2 Mirror verification above.
  const execution = executeCase(definition);
  const executionObservedAt = new Date().toISOString();
  const w3 = createOutcomeReceipt(
    definition,
    pre.w2,
    execution,
    pre.w2.payload.authorizedActionManifest as JsonObject,
    executionObservedAt,
  );
  const w3Manifest = publicManifest(definition, w3);
  const w3Payload = buildAnchorPayload(w3, w3Manifest);
  const w3Evidence = await anchorAndVerify(
    client,
    topicId,
    submitKey,
    mirrorBase,
    w3Payload,
  );

  return {
    caseId: definition.id,
    baselineCaseSlug: definition.slug,
    profile: PROFILE,
    runId,
    executionObservedAt,
    correspondenceVerdict: w3.payload.correspondenceVerdict,
    w2: {
      anchoredReceiptId: pre.w2.receiptId,
      anchoredReceiptHash: pre.w2.receiptHash,
      previousReceiptHash: pre.w2.previousReceiptHash!,
      publicManifest: w2Manifest,
      publicManifestHash: calculatePublicManifestHash(w2Manifest),
      topicId,
      sequenceNumber: w2Evidence.sequenceNumber,
      consensusTimestamp: w2Evidence.consensusTimestamp,
      mirrorLookupReference: w2Evidence.mirrorPath,
      verificationVerdict: w2Evidence.verificationVerdict,
    },
    w3: {
      anchoredReceiptId: w3.receiptId,
      anchoredReceiptHash: w3.receiptHash,
      previousReceiptHash: w3.previousReceiptHash!,
      publicManifest: w3Manifest,
      publicManifestHash: calculatePublicManifestHash(w3Manifest),
      topicId,
      sequenceNumber: w3Evidence.sequenceNumber,
      consensusTimestamp: w3Evidence.consensusTimestamp,
      mirrorLookupReference: w3Evidence.mirrorPath,
      verificationVerdict: w3Evidence.verificationVerdict,
    },
  };
}

async function main(): Promise<void> {
  const config = loadHederaRuntimeConfig();
  const client = createTestnetClient(config);
  const operatorKey = parsePrivateKey(config.operatorKey);
  const submitKey = config.topicSubmitKey
    ? parsePrivateKey(config.topicSubmitKey)
    : operatorKey;

  try {
    const topic = config.topicId
      ? { topicId: config.topicId, creationMode: "EXISTING_TOPIC" }
      : {
          ...(await createControlledTopic(client, submitKey)),
          creationMode: "CREATED_WITH_SUBMIT_KEY",
        };

    const cases: JsonObject[] = [];
    for (const slug of [
      "allow-and-match",
      "block-and-not-executed",
      "allow-but-diverged",
    ]) {
      cases.push(
        await runCase(slug, client, topic.topicId, submitKey, config.mirrorBase),
      );
    }

    const evidence: JsonObject = {
      protocol: "IRP-1",
      schemaVersion: "1",
      profile: PROFILE,
      network: "testnet",
      mirrorBase: config.mirrorBase,
      topicId: topic.topicId,
      topicCreationMode: topic.creationMode,
      cases,
      claimBoundary: "SEMANTIC TRUTH: NOT PROVEN BY IRP-1",
    };

    await rm(OUTPUT_DIR, { recursive: true, force: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
    await writeFile(
      `${OUTPUT_DIR}/index.json`,
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );
    console.log(
      JSON.stringify({
        status: "PHASE5_NETWORK_EVIDENCE_GENERATED",
        network: "testnet",
        topicId: topic.topicId,
        caseCount: cases.length,
        output: `${OUTPUT_DIR}/index.json`,
      }),
    );
  } finally {
    client.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Phase-5 execution failed.");
  process.exitCode = 1;
});
