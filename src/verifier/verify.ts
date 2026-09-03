import { buildAnchorPayload, calculatePublicManifestHash } from "../hedera/anchor.ts";
import { queryMirrorMessage } from "../hedera/mirror-query.ts";
import type { PublicAnchorPayload } from "../hedera/types.ts";
import { verifyMirrorAnchor } from "../hedera/verify-anchor.ts";
import { validateCompleteChain } from "../protocol/chain.ts";
import type { JsonObject, ReceiptEnvelope } from "../protocol/types.ts";
import { validateReceiptIntegrity } from "../protocol/validate.ts";
import type {
  AnchorVerifierResult,
  ApprovalVerifierVerdict,
  ChainVerdict,
  ConsensusVerdict,
  CorrespondenceVerifierVerdict,
  LocalVerifierReport,
  NetworkVerifierReport,
  Phase5AnchorRecord,
  Phase5NetworkEvidence,
  PolicyVerifierVerdict,
  ReceiptBundleInput,
} from "./types.ts";

const BOUNDARY = "SEMANTIC TRUTH: NOT PROVEN BY IRP-1" as const;

function receiptByKind(
  receipts: readonly ReceiptEnvelope[],
  kind: ReceiptEnvelope["receiptKind"],
): ReceiptEnvelope | undefined {
  return receipts.find((receipt) => receipt.receiptKind === kind);
}

function policyVerdict(w2: ReceiptEnvelope | undefined): PolicyVerifierVerdict {
  const value = w2?.payload.policyVerdict;
  return value === "ALLOW" || value === "BLOCK" || value === "ESCALATE"
    ? value
    : "POLICY_UNKNOWN";
}

function approvalVerdict(w2: ReceiptEnvelope | undefined): ApprovalVerifierVerdict {
  const required = (w2?.payload.approvalRequirement as JsonObject | undefined)?.required;
  const state = w2?.payload.approvalState;
  if (required === false || state === "NOT_REQUIRED") return "NOT_REQUIRED";
  if (state === "REQUIRED_APPROVED") return "REQUIRED_AND_APPROVED";
  if (state === "INVALID") return "INVALID";
  return "REQUIRED_NOT_APPROVED";
}

function correspondenceVerdict(
  w3: ReceiptEnvelope | undefined,
): CorrespondenceVerifierVerdict {
  const value = w3?.payload.correspondenceVerdict;
  return value === "MATCH" ||
    value === "PARTIAL_MATCH" ||
    value === "DIVERGED" ||
    value === "NOT_EXECUTED"
    ? value
    : "UNKNOWN";
}

function chainVerdict(
  ok: boolean,
  issueCategories: readonly string[],
): ChainVerdict {
  if (issueCategories.includes("FORK_DETECTED")) return "FORK_DETECTED";
  return ok ? "CHAIN_VALID" : "CHAIN_BROKEN";
}

export function verifyLocalBundle(input: ReceiptBundleInput): LocalVerifierReport {
  const receipts = input.receipts;
  if (!Array.isArray(receipts) || receipts.length === 0) {
    return {
      receiptIntegrity: "MISSING",
      chain: "CHAIN_BROKEN",
      consensus: "NOT_CHECKED",
      policy: "POLICY_UNKNOWN",
      approval: "REQUIRED_NOT_APPROVED",
      correspondence: "UNKNOWN",
      authorization: "UNKNOWN",
      issues: ["No receipts supplied."],
      findings: [],
      semanticTruthBoundary: BOUNDARY,
    };
  }

  const integrityResults = receipts.map((receipt) => validateReceiptIntegrity(receipt));
  const receiptIntegrity = integrityResults.every((result) => result.ok)
    ? "INTACT"
    : "MODIFIED";

  const chain = validateCompleteChain(receipts);
  const w2 = receiptByKind(receipts, "W2_AUTHORIZATION");
  const w3 = receiptByKind(receipts, "W3_OUTCOME");

  return {
    receiptIntegrity,
    chain: chainVerdict(
      chain.ok,
      chain.issues.map((entry) => entry.category),
    ),
    consensus: "NOT_CHECKED",
    policy: policyVerdict(w2),
    approval: approvalVerdict(w2),
    correspondence: correspondenceVerdict(w3),
    authorization:
      typeof w2?.payload.authorizationVerdict === "string"
        ? w2.payload.authorizationVerdict
        : "UNKNOWN",
    issues: [
      ...integrityResults.flatMap((result) =>
        result.issues.map((entry) => `${entry.category}: ${entry.message}`),
      ),
      ...chain.issues.map((entry) => `${entry.category}: ${entry.message}`),
    ],
    findings: chain.findings.map(
      (entry) => `${entry.category}: ${entry.message}`,
    ),
    semanticTruthBoundary: BOUNDARY,
  };
}

function expectedAnchorPayload(record: Phase5AnchorRecord): PublicAnchorPayload {
  const stage = record.publicManifest.anchorStage;
  if (stage !== "W2_AUTHORIZATION" && stage !== "W3_OUTCOME") {
    throw new Error("Network evidence anchorStage is invalid.");
  }
  const manifestHash = calculatePublicManifestHash(
    record.publicManifest as JsonObject,
  );
  if (manifestHash !== record.publicManifestHash) {
    throw new Error("Network evidence publicManifestHash does not recompute.");
  }
  const pseudoReceipt = {
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: stage,
    receiptId: record.anchoredReceiptId,
    sessionId: "network-evidence-verifier",
    nonce: "network-evidence-verifier",
    createdAt: "1970-01-01T00:00:00.000Z",
    previousReceiptHash: record.previousReceiptHash,
    payload: {},
    receiptHash: record.anchoredReceiptHash,
  } satisfies ReceiptEnvelope;
  return buildAnchorPayload(pseudoReceipt, record.publicManifest as JsonObject);
}

function aggregateConsensus(
  results: readonly AnchorVerifierResult[],
): ConsensusVerdict {
  if (results.length === 0) return "NOT_CHECKED";
  if (results.every((entry) => entry.verdict === "ANCHORED")) return "ANCHORED";
  const precedence: ConsensusVerdict[] = [
    "HASH_MISMATCH",
    "PAYLOAD_MISMATCH",
    "TOPIC_MISMATCH",
    "SEQUENCE_MISMATCH",
    "MIRROR_ERROR",
    "NOT_FOUND",
  ];
  return precedence.find((value) => results.some((entry) => entry.verdict === value))
    ?? "MIRROR_ERROR";
}

export async function verifyPhase5NetworkEvidence(
  evidence: Phase5NetworkEvidence,
  fetchImpl: typeof fetch = fetch,
): Promise<NetworkVerifierReport> {
  if (
    evidence.protocol !== "IRP-1" ||
    evidence.schemaVersion !== "1" ||
    evidence.network !== "testnet" ||
    evidence.claimBoundary !== BOUNDARY
  ) {
    throw new Error("Phase-5 network evidence identity or claim boundary is invalid.");
  }

  const anchors: AnchorVerifierResult[] = [];
  for (const caseEvidence of evidence.cases) {
    for (const [stage, record] of [
      ["W2_AUTHORIZATION", caseEvidence.w2],
      ["W3_OUTCOME", caseEvidence.w3],
    ] as const) {
      const expected = expectedAnchorPayload(record);
      let verdict: ConsensusVerdict;
      let issues: string[];
      let consensusTimestamp: string | null = null;
      try {
        const message = await queryMirrorMessage(
          evidence.mirrorBase,
          record.topicId,
          record.sequenceNumber,
          fetchImpl,
        );
        const verification = verifyMirrorAnchor(
          record.topicId,
          record.sequenceNumber,
          expected,
          message,
        );
        verdict = verification.verdict;
        issues = verification.issues;
        consensusTimestamp = verification.consensusTimestamp ?? null;
        if (
          verification.verdict === "ANCHORED" &&
          consensusTimestamp !== record.consensusTimestamp
        ) {
          verdict = "PAYLOAD_MISMATCH";
          issues = ["Consensus timestamp differs from the recorded Phase-5 evidence."];
        }
      } catch (error) {
        verdict = "MIRROR_ERROR";
        issues = [
          error instanceof Error ? error.message : "Mirror verification failed.",
        ];
      }
      anchors.push({
        caseId: caseEvidence.caseId,
        stage,
        topicId: record.topicId,
        sequenceNumber: record.sequenceNumber,
        consensusTimestamp,
        verdict,
        issues,
      });
    }
  }

  return {
    consensus: aggregateConsensus(anchors),
    anchors,
    semanticTruthBoundary: BOUNDARY,
  };
}
