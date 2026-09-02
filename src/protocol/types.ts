export const PROTOCOL = "IRP-1" as const;
export const SCHEMA_VERSION = "1" as const;

export const RECEIPT_KINDS = [
  "W0_OBSERVATION",
  "W1_INTENT",
  "W2_AUTHORIZATION",
  "W3_OUTCOME",
] as const;

export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

export const POLICY_VERDICTS = ["ALLOW", "BLOCK", "ESCALATE"] as const;
export type PolicyVerdict = (typeof POLICY_VERDICTS)[number];

export const APPROVAL_STATES = [
  "NOT_REQUIRED",
  "REQUIRED_PENDING",
  "REQUIRED_APPROVED",
  "REQUIRED_REJECTED",
  "INVALID",
] as const;
export type ApprovalState = (typeof APPROVAL_STATES)[number];

export const AUTHORIZATION_VERDICTS = [
  "AUTHORIZED",
  "BLOCKED",
  "PENDING_APPROVAL",
  "UNRESOLVED",
] as const;
export type AuthorizationVerdict = (typeof AUTHORIZATION_VERDICTS)[number];

export const EXECUTION_STATES = [
  "EXECUTED",
  "NOT_EXECUTED",
  "PARTIALLY_EXECUTED",
  "EXECUTION_UNKNOWN",
] as const;
export type ExecutionState = (typeof EXECUTION_STATES)[number];

export const CORRESPONDENCE_VERDICTS = [
  "MATCH",
  "PARTIAL_MATCH",
  "DIVERGED",
  "NOT_EXECUTED",
] as const;
export type CorrespondenceVerdict = (typeof CORRESPONDENCE_VERDICTS)[number];

export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export interface ReceiptEnvelope<TPayload extends JsonObject = JsonObject> {
  protocol: typeof PROTOCOL;
  schemaVersion: typeof SCHEMA_VERSION;
  receiptKind: ReceiptKind;
  receiptId: string;
  sessionId: string;
  nonce: string;
  createdAt: string;
  previousReceiptHash: string | null;
  payload: TPayload;
  receiptHash: string;
}

export type ReceiptDraft<TPayload extends JsonObject = JsonObject> = Omit<
  ReceiptEnvelope<TPayload>,
  "receiptHash"
>;

export type FailureCategory =
  | "INVALID_SCHEMA"
  | "UNSUPPORTED_VALUE"
  | "CANONICALIZATION_FAILURE"
  | "HASH_MISMATCH"
  | "PARENT_HASH_MISMATCH"
  | "SEMANTIC_PARENT_MISMATCH"
  | "SESSION_MISMATCH"
  | "DUPLICATE_NONCE"
  | "INVALID_STAGE_ORDER"
  | "MISSING_STAGE"
  | "TIME_ORDER_VIOLATION"
  | "POLICY_BLOCK"
  | "POLICY_ESCALATE"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_INVALID"
  | "UNAUTHORIZED_EXECUTION"
  | "ACTION_DIVERGENCE"
  | "FORK_DETECTED";

export interface ValidationIssue {
  category: FailureCategory;
  message: string;
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

export interface ChainValidationResult extends ValidationResult {
  findings: ValidationIssue[];
}

export class ProtocolError extends Error {
  readonly category: FailureCategory;
  readonly path?: string;

  constructor(category: FailureCategory, message: string, path?: string) {
    super(message);
    this.name = "ProtocolError";
    this.category = category;
    this.path = path;
  }
}
