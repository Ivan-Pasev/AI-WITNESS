export const ANCHOR_RECEIPT_KINDS = [
  "W2_AUTHORIZATION",
  "W3_OUTCOME",
] as const;

export type AnchorReceiptKind = (typeof ANCHOR_RECEIPT_KINDS)[number];

export interface PublicAnchorPayload {
  protocol: "IRP-1";
  schemaVersion: "1";
  receiptId: string;
  receiptKind: AnchorReceiptKind;
  receiptHash: string;
  previousReceiptHash: string;
  publicManifestHash: string;
}

export const ANCHOR_VERIFICATION_VERDICTS = [
  "ANCHORED",
  "NOT_FOUND",
  "TOPIC_MISMATCH",
  "SEQUENCE_MISMATCH",
  "PAYLOAD_MISMATCH",
  "HASH_MISMATCH",
  "MIRROR_ERROR",
  "NOT_CHECKED",
] as const;

export type AnchorVerificationVerdict =
  (typeof ANCHOR_VERIFICATION_VERDICTS)[number];

export interface MirrorTopicMessage {
  topicId: string;
  sequenceNumber: number;
  consensusTimestamp: string;
  messageBase64: string;
  runningHash?: string;
  runningHashVersion?: number;
  payerAccountId?: string | null;
}

export interface AnchorVerificationResult {
  verdict: AnchorVerificationVerdict;
  issues: string[];
  consensusTimestamp?: string;
  decodedPayload?: PublicAnchorPayload;
}

export interface HederaRuntimeConfig {
  network: "testnet";
  operatorId: string;
  operatorKey: string;
  topicId?: string;
  topicSubmitKey?: string;
  mirrorBase: string;
}

export interface SubmittedAnchor {
  topicId: string;
  sequenceNumber: number;
}
