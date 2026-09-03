import type { ReceiptEnvelope } from "../protocol/types.ts";

export type ReceiptIntegrityVerdict = "INTACT" | "MODIFIED" | "MISSING";
export type ChainVerdict = "CHAIN_VALID" | "CHAIN_BROKEN" | "FORK_DETECTED";
export type ConsensusVerdict =
  | "ANCHORED"
  | "NOT_FOUND"
  | "TOPIC_MISMATCH"
  | "SEQUENCE_MISMATCH"
  | "HASH_MISMATCH"
  | "PAYLOAD_MISMATCH"
  | "MIRROR_ERROR"
  | "NOT_CHECKED";
export type PolicyVerifierVerdict = "ALLOW" | "BLOCK" | "ESCALATE" | "POLICY_UNKNOWN";
export type ApprovalVerifierVerdict =
  | "NOT_REQUIRED"
  | "REQUIRED_AND_APPROVED"
  | "REQUIRED_NOT_APPROVED"
  | "INVALID";
export type CorrespondenceVerifierVerdict =
  | "MATCH"
  | "PARTIAL_MATCH"
  | "DIVERGED"
  | "NOT_EXECUTED"
  | "UNKNOWN";

export interface ReceiptBundleInput {
  receipts: ReceiptEnvelope[];
}

export interface LocalVerifierReport {
  receiptIntegrity: ReceiptIntegrityVerdict;
  chain: ChainVerdict;
  consensus: "NOT_CHECKED";
  policy: PolicyVerifierVerdict;
  approval: ApprovalVerifierVerdict;
  correspondence: CorrespondenceVerifierVerdict;
  authorization: string;
  issues: string[];
  findings: string[];
  semanticTruthBoundary: "SEMANTIC TRUTH: NOT PROVEN BY IRP-1";
}

export interface Phase5AnchorRecord {
  anchoredReceiptId: string;
  anchoredReceiptHash: string;
  previousReceiptHash: string;
  publicManifest: Record<string, unknown>;
  publicManifestHash: string;
  topicId: string;
  sequenceNumber: number;
  consensusTimestamp: string;
  mirrorLookupReference: string;
  verificationVerdict: string;
}

export interface Phase5CaseEvidence {
  caseId: string;
  correspondenceVerdict: string;
  w2: Phase5AnchorRecord;
  w3: Phase5AnchorRecord;
}

export interface Phase5NetworkEvidence {
  protocol: string;
  schemaVersion: string;
  profile: string;
  network: string;
  mirrorBase: string;
  topicId: string;
  cases: Phase5CaseEvidence[];
  claimBoundary: string;
}

export interface AnchorVerifierResult {
  caseId: string;
  stage: "W2_AUTHORIZATION" | "W3_OUTCOME";
  topicId: string;
  sequenceNumber: number;
  consensusTimestamp: string | null;
  verdict: ConsensusVerdict;
  issues: string[];
}

export interface NetworkVerifierReport {
  consensus: ConsensusVerdict;
  anchors: AnchorVerifierResult[];
  semanticTruthBoundary: "SEMANTIC TRUTH: NOT PROVEN BY IRP-1";
}
