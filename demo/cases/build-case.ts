import { evaluatePolicy } from "../../src/policy/evaluate.ts";
import type { PolicyDocument, PolicyInput } from "../../src/policy/types.ts";
import { createReceipt } from "../../src/protocol/create-receipt.ts";
import type { JsonObject, ReceiptEnvelope } from "../../src/protocol/types.ts";
import { canonicalize } from "../../src/protocol/canonicalize.ts";
import { buildAppendManifest, sha256Text, stateHash } from "./compare-action.ts";
import type { DemoCaseDefinition } from "./types.ts";
import type { DemoState } from "../executors/types.ts";

export const DEMO_POLICY: PolicyDocument = {
  policyId: "github-demo-policy",
  version: "1",
  rules: [
    { id: "path-allowlist", type: "PATH_ALLOWLIST", patterns: ["demo/**"] },
    {
      id: "path-denylist",
      type: "PATH_DENYLIST",
      patterns: [
        ".env",
        ".env.*",
        ".git/**",
        ".github/**",
        "src/hedera/**",
        "receipts/private/**",
        "demo/protected/**",
      ],
    },
    { id: "secret-scan", type: "SECRET_SCAN", mode: "DEMO_HEURISTIC" },
    { id: "change-count", type: "CHANGE_COUNT", maxChangedFiles: 1 },
    { id: "human-approval", type: "HUMAN_APPROVAL", required: true },
  ],
};

export const BASE_STATE: DemoState = {
  files: {
    "demo/target.md": "# IRP-1 Demo Target\n\nBaseline content.\n",
    "demo/adversarial-extra.md":
      "# IRP-1 Adversarial Extra Fixture\n\nBaseline extra content.\n",
    "demo/protected/immutable.txt": "IRP-1 protected synthetic fixture.\n",
  },
};

export const CASE_DEFINITIONS: Readonly<Record<string, DemoCaseDefinition>> = {
  "allow-and-match": {
    id: "ALLOW_AND_MATCH",
    slug: "allow-and-match",
    mode: "MATCH",
    sessionId: "demo-session-a",
    targetPath: "demo/target.md",
    appendText: "Authorized append for ALLOW_AND_MATCH.\n",
    proposalText:
      "Append the fixed ALLOW_AND_MATCH sentence to demo/target.md.",
    interpretation:
      "The bounded requested append is within the demo policy surface.",
    receiptIds: ["demo-a-w0", "demo-a-w1", "demo-a-w2", "demo-a-w3"],
    nonces: ["demo-a-n0", "demo-a-n1", "demo-a-n2", "demo-a-n3"],
    createdAt: [
      "2026-09-02T10:00:00Z",
      "2026-09-02T10:00:01Z",
      "2026-09-02T10:00:02Z",
      "2026-09-02T10:00:03Z",
    ],
  },
  "block-and-not-executed": {
    id: "BLOCK_AND_NOT_EXECUTED",
    slug: "block-and-not-executed",
    mode: "BLOCK",
    sessionId: "demo-session-b",
    targetPath: "demo/protected/immutable.txt",
    appendText: "SYNTHETIC_PRIVATE_KEY\n",
    proposalText:
      "Attempt synthetic append SYNTHETIC_PRIVATE_KEY to demo/protected/immutable.txt.",
    interpretation:
      "The requested synthetic append targets a denied demo path and includes an obvious synthetic marker.",
    receiptIds: ["demo-b-w0", "demo-b-w1", "demo-b-w2", "demo-b-w3"],
    nonces: ["demo-b-n0", "demo-b-n1", "demo-b-n2", "demo-b-n3"],
    createdAt: [
      "2026-09-02T11:00:00Z",
      "2026-09-02T11:00:01Z",
      "2026-09-02T11:00:02Z",
      "2026-09-02T11:00:03Z",
    ],
  },
  "allow-but-diverged": {
    id: "ALLOW_BUT_DIVERGED",
    slug: "allow-but-diverged",
    mode: "DIVERGE",
    sessionId: "demo-session-c",
    targetPath: "demo/target.md",
    appendText: "Authorized append for ALLOW_BUT_DIVERGED.\n",
    proposalText:
      "Append the fixed ALLOW_BUT_DIVERGED sentence to demo/target.md.",
    interpretation:
      "The bounded requested append is within policy; execution correspondence must still be checked.",
    extraText:
      "Controlled unauthorized extra append for ALLOW_BUT_DIVERGED.\n",
    receiptIds: ["demo-c-w0", "demo-c-w1", "demo-c-w2", "demo-c-w3"],
    nonces: ["demo-c-n0", "demo-c-n1", "demo-c-n2", "demo-c-n3"],
    createdAt: [
      "2026-09-02T12:00:00Z",
      "2026-09-02T12:00:01Z",
      "2026-09-02T12:00:02Z",
      "2026-09-02T12:00:03Z",
    ],
  },
};

function publicRuleResults(
  results: ReturnType<typeof evaluatePolicy>["ruleResults"],
): JsonObject[] {
  return results.map((entry) => ({
    ruleId: entry.ruleId,
    ruleType: entry.ruleType,
    result: entry.result,
    reasonCode: entry.reasonCode,
    details: entry.details,
  }));
}

export function buildPreExecutionCase(definition: DemoCaseDefinition): {
  beforeState: DemoState;
  requestedActionManifest: JsonObject;
  policyInput: PolicyInput;
  policyEvaluation: ReturnType<typeof evaluatePolicy>;
  w0: ReceiptEnvelope;
  w1: ReceiptEnvelope;
  w2: ReceiptEnvelope;
} {
  const beforeState: DemoState = { files: { ...BASE_STATE.files } };
  const requestedActionManifest = buildAppendManifest(beforeState, [
    { path: definition.targetPath, appendText: definition.appendText },
  ]);
  const policyInput: PolicyInput = {
    targetPaths: [definition.targetPath],
    changedFileCount: 1,
    proposalText: definition.proposalText,
    approvalState: "REQUIRED_APPROVED",
  };
  const policyEvaluation = evaluatePolicy(DEMO_POLICY, policyInput);

  const w0 = createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W0_OBSERVATION",
    receiptId: definition.receiptIds[0],
    sessionId: definition.sessionId,
    nonce: definition.nonces[0],
    createdAt: definition.createdAt[0],
    previousReceiptHash: null,
    payload: {
      observationScope: {
        caseId: definition.id,
        scope: "synthetic in-repository demo fixtures only",
      },
      evidenceManifest: Object.keys(beforeState.files)
        .sort()
        .map((path) => ({ path, sha256: sha256Text(beforeState.files[path]!) })),
      repositoryState: {
        fixtureStateHash: stateHash(beforeState),
        fixturePaths: Object.keys(beforeState.files).sort(),
      },
      constraints: [
        "deterministic scripted execution",
        "no network calls",
        "no live model",
        "no Hedera",
      ],
      declaredUnknowns: ["semantic correctness is outside this proof"],
      redactions: [],
    },
  });

  const w1 = createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W1_INTENT",
    receiptId: definition.receiptIds[1],
    sessionId: definition.sessionId,
    nonce: definition.nonces[1],
    createdAt: definition.createdAt[1],
    previousReceiptHash: w0.receiptHash,
    payload: {
      interpretation: {
        caseId: definition.id,
        statement: definition.interpretation,
      },
      assumptions: ["fixture contents equal committed synthetic baseline"],
      uncertainty: {
        known: ["requested path and append text are fixed"],
        uncertain: [],
        unknown: ["semantic correctness"],
        limitations: ["deterministic demo only"],
      },
      intendedAction: {
        operation: "APPEND_TEXT",
        targetPath: definition.targetPath,
        appendText: definition.appendText,
      },
      actionManifest: requestedActionManifest,
      expectedEffect: { changedFileCount: 1 },
      policyRef: { policyId: "github-demo-policy", version: "1" },
      approvalExpectation: { required: true },
    },
  });

  const authorizationVerdict =
    policyEvaluation.verdict === "ALLOW"
      ? "AUTHORIZED"
      : policyEvaluation.verdict === "BLOCK"
        ? "BLOCKED"
        : "UNRESOLVED";

  const authorizedActionManifest: JsonObject =
    authorizationVerdict === "AUTHORIZED"
      ? requestedActionManifest
      : {
          status: "NOT_AUTHORIZED",
          requestedActionManifestHash: sha256Text(canonicalize(requestedActionManifest)),
        };

  const w2 = createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W2_AUTHORIZATION",
    receiptId: definition.receiptIds[2],
    sessionId: definition.sessionId,
    nonce: definition.nonces[2],
    createdAt: definition.createdAt[2],
    previousReceiptHash: w1.receiptHash,
    payload: {
      intentReceiptHash: w1.receiptHash,
      policy: { id: policyEvaluation.policyId, version: policyEvaluation.policyVersion },
      policyHash: policyEvaluation.policyHash,
      policyInput: {
        targetPaths: [definition.targetPath],
        changedFileCount: 1,
        proposalText: definition.proposalText,
        approvalState: "REQUIRED_APPROVED",
      },
      policyEvaluation: publicRuleResults(policyEvaluation.ruleResults),
      policyVerdict: policyEvaluation.verdict,
      approvalRequirement: { required: true },
      approvalState: "REQUIRED_APPROVED",
      authorizationVerdict,
      authorizedActionManifest,
      authorizationConstraints: [
        "exact action manifest binding",
        "execution forbidden unless AUTHORIZED",
      ],
    },
  });

  return {
    beforeState,
    requestedActionManifest,
    policyInput,
    policyEvaluation,
    w0,
    w1,
    w2,
  };
}
