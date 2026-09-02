import {
  APPROVAL_STATES,
  AUTHORIZATION_VERDICTS,
  CORRESPONDENCE_VERDICTS,
  EXECUTION_STATES,
  POLICY_VERDICTS,
  PROTOCOL,
  RECEIPT_KINDS,
  SCHEMA_VERSION,
  type ApprovalState,
  type AuthorizationVerdict,
  type CorrespondenceVerdict,
  type ExecutionState,
  type JsonObject,
  type PolicyVerdict,
  ProtocolError,
  type ReceiptEnvelope,
  type ReceiptKind,
  type ValidationIssue,
  type ValidationResult,
} from "./types.ts";
import { assertAcceptedJson } from "./canonicalize.ts";
import { verifyReceiptHash } from "./hash.ts";

const HASH_RE = /^[0-9a-f]{64}$/;
const UTC_RFC3339_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

function issue(
  category: ValidationIssue["category"],
  message: string,
  path?: string,
): ValidationIssue {
  return { category, message, ...(path === undefined ? {} : { path }) };
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasRequiredKeys(value: JsonObject, keys: readonly string[]): boolean {
  return keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isEnumValue<T extends readonly string[]>(
  value: unknown,
  values: T,
): value is T[number] {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isUtcTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    UTC_RFC3339_RE.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function validateW0Payload(payload: JsonObject, issues: ValidationIssue[]): void {
  const required = [
    "observationScope",
    "evidenceManifest",
    "repositoryState",
    "constraints",
    "declaredUnknowns",
    "redactions",
  ] as const;
  if (!hasRequiredKeys(payload, required)) {
    issues.push(issue("INVALID_SCHEMA", "W0 payload is missing required fields.", "payload"));
    return;
  }
  if (
    !isJsonObject(payload.observationScope) ||
    !Array.isArray(payload.evidenceManifest) ||
    !isJsonObject(payload.repositoryState) ||
    !Array.isArray(payload.constraints) ||
    !Array.isArray(payload.declaredUnknowns) ||
    !Array.isArray(payload.redactions)
  ) {
    issues.push(issue("INVALID_SCHEMA", "W0 payload field types are invalid.", "payload"));
  }
}

function validateW1Payload(payload: JsonObject, issues: ValidationIssue[]): void {
  const required = [
    "interpretation",
    "assumptions",
    "uncertainty",
    "intendedAction",
    "actionManifest",
    "expectedEffect",
    "policyRef",
    "approvalExpectation",
  ] as const;
  if (!hasRequiredKeys(payload, required)) {
    issues.push(issue("INVALID_SCHEMA", "W1 payload is missing required fields.", "payload"));
    return;
  }
  const uncertainty = payload.uncertainty;
  if (
    !isJsonObject(payload.interpretation) ||
    !Array.isArray(payload.assumptions) ||
    !isJsonObject(uncertainty) ||
    !Array.isArray(uncertainty.known) ||
    !Array.isArray(uncertainty.uncertain) ||
    !Array.isArray(uncertainty.unknown) ||
    !Array.isArray(uncertainty.limitations) ||
    !isJsonObject(payload.intendedAction) ||
    !isJsonObject(payload.actionManifest) ||
    !isJsonObject(payload.expectedEffect) ||
    !isJsonObject(payload.policyRef) ||
    !isJsonObject(payload.approvalExpectation)
  ) {
    issues.push(issue("INVALID_SCHEMA", "W1 payload field types are invalid.", "payload"));
  }
}

function approvalIsRequired(
  approvalRequirement: JsonObject,
  approvalState: ApprovalState,
): boolean {
  return approvalRequirement.required === true || approvalState !== "NOT_REQUIRED";
}

function validateW2Payload(payload: JsonObject, issues: ValidationIssue[]): void {
  const required = [
    "intentReceiptHash",
    "policy",
    "policyHash",
    "policyInput",
    "policyEvaluation",
    "policyVerdict",
    "approvalRequirement",
    "approvalState",
    "authorizationVerdict",
    "authorizedActionManifest",
    "authorizationConstraints",
  ] as const;
  if (!hasRequiredKeys(payload, required)) {
    issues.push(issue("INVALID_SCHEMA", "W2 payload is missing required fields.", "payload"));
    return;
  }

  const policy = payload.policy;
  const approvalRequirement = payload.approvalRequirement;
  const policyVerdict = payload.policyVerdict;
  const approvalState = payload.approvalState;
  const authorizationVerdict = payload.authorizationVerdict;

  if (
    typeof payload.intentReceiptHash !== "string" ||
    !HASH_RE.test(payload.intentReceiptHash) ||
    !isJsonObject(policy) ||
    !isNonEmptyString(policy.id) ||
    !isNonEmptyString(policy.version) ||
    typeof payload.policyHash !== "string" ||
    !HASH_RE.test(payload.policyHash) ||
    !isJsonObject(payload.policyInput) ||
    !Array.isArray(payload.policyEvaluation) ||
    !isEnumValue(policyVerdict, POLICY_VERDICTS) ||
    !isJsonObject(approvalRequirement) ||
    !isEnumValue(approvalState, APPROVAL_STATES) ||
    !isEnumValue(authorizationVerdict, AUTHORIZATION_VERDICTS) ||
    !isJsonObject(payload.authorizedActionManifest) ||
    !Array.isArray(payload.authorizationConstraints)
  ) {
    issues.push(issue("INVALID_SCHEMA", "W2 payload field types or enum values are invalid.", "payload"));
    return;
  }

  for (const [index, evaluation] of payload.policyEvaluation.entries()) {
    if (!isJsonObject(evaluation) || !isEnumValue(evaluation.result, ["PASS", "FAIL", "UNKNOWN"] as const)) {
      issues.push(
        issue(
          "INVALID_SCHEMA",
          "Each W2 policyEvaluation entry must be an object with result PASS, FAIL, or UNKNOWN.",
          `payload.policyEvaluation[${index}]`,
        ),
      );
    }
  }

  const typedPolicy = policyVerdict as PolicyVerdict;
  const typedApproval = approvalState as ApprovalState;
  const typedAuthorization = authorizationVerdict as AuthorizationVerdict;

  if (typedPolicy === "BLOCK" && typedAuthorization !== "BLOCKED") {
    issues.push(
      issue(
        "POLICY_BLOCK",
        "BLOCK policy verdict cannot be represented as an authorization other than BLOCKED.",
        "payload.authorizationVerdict",
      ),
    );
  }

  if (typedPolicy === "ESCALATE" && typedAuthorization === "AUTHORIZED") {
    issues.push(
      issue(
        "POLICY_ESCALATE",
        "ESCALATE policy verdict cannot silently become AUTHORIZED.",
        "payload.authorizationVerdict",
      ),
    );
  }

  if (typedApproval === "INVALID") {
    issues.push(
      issue(
        "APPROVAL_INVALID",
        "INVALID approval state cannot support authorization.",
        "payload.approvalState",
      ),
    );
  }

  if (
    approvalIsRequired(approvalRequirement, typedApproval) &&
    typedApproval !== "REQUIRED_APPROVED" &&
    typedAuthorization === "AUTHORIZED"
  ) {
    issues.push(
      issue(
        "APPROVAL_REQUIRED",
        "Required approval must already be REQUIRED_APPROVED before AUTHORIZED.",
        "payload.approvalState",
      ),
    );
  }
}

function validateW3Payload(payload: JsonObject, issues: ValidationIssue[]): void {
  const required = [
    "authorizationReceiptHash",
    "executionState",
    "actualActionManifest",
    "observedResult",
    "correspondenceVerdict",
    "violations",
    "residualUnknowns",
  ] as const;
  if (!hasRequiredKeys(payload, required)) {
    issues.push(issue("INVALID_SCHEMA", "W3 payload is missing required fields.", "payload"));
    return;
  }

  if (
    typeof payload.authorizationReceiptHash !== "string" ||
    !HASH_RE.test(payload.authorizationReceiptHash) ||
    !isEnumValue(payload.executionState, EXECUTION_STATES) ||
    !isJsonObject(payload.actualActionManifest) ||
    !isJsonObject(payload.observedResult) ||
    !isEnumValue(payload.correspondenceVerdict, CORRESPONDENCE_VERDICTS) ||
    !Array.isArray(payload.violations) ||
    !Array.isArray(payload.residualUnknowns)
  ) {
    issues.push(issue("INVALID_SCHEMA", "W3 payload field types or enum values are invalid.", "payload"));
    return;
  }

  const execution = payload.executionState as ExecutionState;
  const correspondence = payload.correspondenceVerdict as CorrespondenceVerdict;

  if (execution === "NOT_EXECUTED" && correspondence !== "NOT_EXECUTED") {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "NOT_EXECUTED execution state requires NOT_EXECUTED correspondence.",
        "payload.correspondenceVerdict",
      ),
    );
  }

  if (execution === "EXECUTED" && correspondence === "NOT_EXECUTED") {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "EXECUTED cannot use NOT_EXECUTED correspondence.",
        "payload.correspondenceVerdict",
      ),
    );
  }
}

export function validateReceiptSchema(value: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];

  try {
    assertAcceptedJson(value);
  } catch (error) {
    if (error instanceof ProtocolError) {
      return {
        ok: false,
        issues: [issue(error.category, error.message, error.path)],
      };
    }
    return {
      ok: false,
      issues: [issue("INVALID_SCHEMA", "Receipt is outside the accepted value domain.")],
    };
  }

  if (!isJsonObject(value)) {
    return {
      ok: false,
      issues: [issue("INVALID_SCHEMA", "Receipt envelope must be an object.")],
    };
  }

  const requiredEnvelopeKeys = [
    "protocol",
    "schemaVersion",
    "receiptKind",
    "receiptId",
    "sessionId",
    "nonce",
    "createdAt",
    "previousReceiptHash",
    "payload",
    "receiptHash",
  ] as const;

  const actualKeys = Object.keys(value);
  if (
    actualKeys.length !== requiredEnvelopeKeys.length ||
    !hasRequiredKeys(value, requiredEnvelopeKeys)
  ) {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "Receipt envelope must contain exactly the frozen IRP-1 envelope fields.",
      ),
    );
  }

  if (value.protocol !== PROTOCOL || value.schemaVersion !== SCHEMA_VERSION) {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "Receipt protocol/schema identity does not match IRP-1 schemaVersion 1.",
      ),
    );
  }

  if (!isEnumValue(value.receiptKind, RECEIPT_KINDS)) {
    issues.push(issue("INVALID_SCHEMA", "Invalid receiptKind.", "receiptKind"));
  }

  if (!isNonEmptyString(value.receiptId)) {
    issues.push(issue("INVALID_SCHEMA", "receiptId must be non-empty.", "receiptId"));
  }
  if (!isNonEmptyString(value.sessionId)) {
    issues.push(issue("INVALID_SCHEMA", "sessionId must be non-empty.", "sessionId"));
  }
  if (!isNonEmptyString(value.nonce)) {
    issues.push(issue("INVALID_SCHEMA", "nonce must be non-empty.", "nonce"));
  }
  if (!isUtcTimestamp(value.createdAt)) {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "createdAt must be an unambiguous RFC 3339 UTC timestamp using Z.",
        "createdAt",
      ),
    );
  }

  if (value.receiptKind === "W0_OBSERVATION") {
    if (value.previousReceiptHash !== null) {
      issues.push(
        issue(
          "INVALID_SCHEMA",
          "W0 previousReceiptHash must be null.",
          "previousReceiptHash",
        ),
      );
    }
  } else if (
    typeof value.previousReceiptHash !== "string" ||
    !HASH_RE.test(value.previousReceiptHash)
  ) {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "W1/W2/W3 previousReceiptHash must be a lowercase 64-hex SHA-256 digest.",
        "previousReceiptHash",
      ),
    );
  }

  if (!isJsonObject(value.payload)) {
    issues.push(issue("INVALID_SCHEMA", "payload must be an object.", "payload"));
  } else if (isEnumValue(value.receiptKind, RECEIPT_KINDS)) {
    const kind = value.receiptKind as ReceiptKind;
    if (kind === "W0_OBSERVATION") {
      validateW0Payload(value.payload, issues);
    } else if (kind === "W1_INTENT") {
      validateW1Payload(value.payload, issues);
    } else if (kind === "W2_AUTHORIZATION") {
      validateW2Payload(value.payload, issues);
    } else if (kind === "W3_OUTCOME") {
      validateW3Payload(value.payload, issues);
    }
  }

  if (typeof value.receiptHash !== "string" || !HASH_RE.test(value.receiptHash)) {
    issues.push(
      issue(
        "INVALID_SCHEMA",
        "receiptHash must be a lowercase 64-hex SHA-256 digest.",
        "receiptHash",
      ),
    );
  }

  return { ok: issues.length === 0, issues };
}

export function validateReceiptIntegrity(receipt: ReceiptEnvelope): ValidationResult {
  const schema = validateReceiptSchema(receipt);
  if (!schema.ok) {
    return schema;
  }

  if (!verifyReceiptHash(receipt)) {
    return {
      ok: false,
      issues: [issue("HASH_MISMATCH", "receiptHash does not match the deterministic digest.")],
    };
  }

  return { ok: true, issues: [] };
}
