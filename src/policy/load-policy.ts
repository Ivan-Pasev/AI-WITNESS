import { createHash } from "node:crypto";

import { assertAcceptedJson, canonicalize } from "../protocol/canonicalize.ts";
import {
  POLICY_RULE_TYPES,
  type ChangeCountRule,
  type HumanApprovalRule,
  type LoadedPolicy,
  type PathRule,
  type PolicyDocument,
  PolicyError,
  type PolicyRule,
  type SecretScanRule,
} from "./types.ts";

export const POLICY_HASH_DOMAIN = "IRP1:POLICY" as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PolicyError("INVALID_POLICY", "Expected an object.", path);
  }
  return value;
}

function requireNonEmptyString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new PolicyError("INVALID_POLICY", "Expected a non-empty string.", path);
  }
  return value;
}

function assertExactKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      const lowered = key.toLowerCase();
      if (lowered.includes("override") || lowered.includes("bypass")) {
        throw new PolicyError(
          "BYPASS_FIELD_REJECTED",
          "Override/bypass fields are not part of IRP-1 policy v1.",
          `${path}.${key}`,
        );
      }
      throw new PolicyError(
        "INVALID_POLICY",
        `Unexpected policy field: ${key}.`,
        `${path}.${key}`,
      );
    }
  }

  for (const key of allowed) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      throw new PolicyError(
        "INVALID_POLICY",
        `Missing required field: ${key}.`,
        `${path}.${key}`,
      );
    }
  }
}

function isAbsoluteLike(path: string): boolean {
  return path.startsWith("/") || /^[A-Za-z]:\//u.test(path);
}

function hasInvalidSegments(path: string): boolean {
  const segments = path.split("/");
  return segments.some(
    (segment) => segment.length === 0 || segment === "." || segment === "..",
  );
}

export function isValidPolicyPathPattern(pattern: string): boolean {
  if (
    pattern.length === 0 ||
    pattern.includes("\\") ||
    isAbsoluteLike(pattern)
  ) {
    return false;
  }

  if (pattern.endsWith("/**")) {
    const root = pattern.slice(0, -3);
    return (
      root.length > 0 &&
      !root.includes("*") &&
      !hasInvalidSegments(root)
    );
  }

  if (pattern.endsWith(".*")) {
    const root = pattern.slice(0, -2);
    return (
      root.length > 0 &&
      !root.includes("*") &&
      !root.includes("/") &&
      !hasInvalidSegments(root)
    );
  }

  return !pattern.includes("*") && !hasInvalidSegments(pattern);
}

function parsePathRule(
  record: Record<string, unknown>,
  index: number,
  type: PathRule["type"],
): PathRule {
  const path = `$.rules[${index}]`;
  assertExactKeys(record, ["id", "type", "patterns"], path);
  const id = requireNonEmptyString(record.id, `${path}.id`);
  if (!Array.isArray(record.patterns) || record.patterns.length === 0) {
    throw new PolicyError(
      "MALFORMED_RULE",
      "Path rule requires a non-empty patterns array.",
      `${path}.patterns`,
    );
  }
  const patterns = record.patterns.map((entry, patternIndex) => {
    if (typeof entry !== "string" || !isValidPolicyPathPattern(entry)) {
      throw new PolicyError(
        "MALFORMED_RULE",
        "Invalid repository-relative path pattern.",
        `${path}.patterns[${patternIndex}]`,
      );
    }
    return entry;
  });
  return { id, type, patterns };
}

function parseSecretRule(
  record: Record<string, unknown>,
  index: number,
): SecretScanRule {
  const path = `$.rules[${index}]`;
  assertExactKeys(record, ["id", "type", "mode"], path);
  const id = requireNonEmptyString(record.id, `${path}.id`);
  if (record.mode !== "DEMO_HEURISTIC") {
    throw new PolicyError(
      "MALFORMED_RULE",
      "SECRET_SCAN mode must be DEMO_HEURISTIC in Phase 3.",
      `${path}.mode`,
    );
  }
  return { id, type: "SECRET_SCAN", mode: "DEMO_HEURISTIC" };
}

function parseChangeCountRule(
  record: Record<string, unknown>,
  index: number,
): ChangeCountRule {
  const path = `$.rules[${index}]`;
  assertExactKeys(record, ["id", "type", "maxChangedFiles"], path);
  const id = requireNonEmptyString(record.id, `${path}.id`);
  const limit = record.maxChangedFiles;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0) {
    throw new PolicyError(
      "MALFORMED_RULE",
      "maxChangedFiles must be a non-negative integer.",
      `${path}.maxChangedFiles`,
    );
  }
  return { id, type: "CHANGE_COUNT", maxChangedFiles: limit };
}

function parseHumanApprovalRule(
  record: Record<string, unknown>,
  index: number,
): HumanApprovalRule {
  const path = `$.rules[${index}]`;
  assertExactKeys(record, ["id", "type", "required"], path);
  const id = requireNonEmptyString(record.id, `${path}.id`);
  if (typeof record.required !== "boolean") {
    throw new PolicyError(
      "MALFORMED_RULE",
      "HUMAN_APPROVAL.required must be boolean.",
      `${path}.required`,
    );
  }
  return { id, type: "HUMAN_APPROVAL", required: record.required };
}

function parseRule(value: unknown, index: number): PolicyRule {
  const record = requireRecord(value, `$.rules[${index}]`);
  const type = record.type;
  if (typeof type !== "string") {
    throw new PolicyError(
      "MALFORMED_RULE",
      "Rule type must be a string.",
      `$.rules[${index}].type`,
    );
  }

  if (!POLICY_RULE_TYPES.includes(type as (typeof POLICY_RULE_TYPES)[number])) {
    throw new PolicyError(
      "UNKNOWN_RULE_TYPE",
      `Unknown rule type: ${type}.`,
      `$.rules[${index}].type`,
    );
  }

  switch (type) {
    case "PATH_ALLOWLIST":
    case "PATH_DENYLIST":
      return parsePathRule(record, index, type);
    case "SECRET_SCAN":
      return parseSecretRule(record, index);
    case "CHANGE_COUNT":
      return parseChangeCountRule(record, index);
    case "HUMAN_APPROVAL":
      return parseHumanApprovalRule(record, index);
    default:
      throw new PolicyError("UNKNOWN_RULE_TYPE", "Unknown rule type.");
  }
}

function validatePolicyDocument(value: unknown): PolicyDocument {
  try {
    assertAcceptedJson(value);
  } catch (error) {
    throw new PolicyError(
      "INVALID_POLICY",
      error instanceof Error ? error.message : "Unsupported policy value.",
    );
  }

  const record = requireRecord(value, "$ ".trim());
  assertExactKeys(record, ["policyId", "version", "rules"], "$");
  const policyId = requireNonEmptyString(record.policyId, "$.policyId");
  const version = requireNonEmptyString(record.version, "$.version");
  if (!Array.isArray(record.rules) || record.rules.length === 0) {
    throw new PolicyError(
      "INVALID_POLICY",
      "Policy rules must be a non-empty array.",
      "$.rules",
    );
  }

  const rules = record.rules.map((rule, index) => parseRule(rule, index));
  const ids = new Set<string>();
  for (const rule of rules) {
    if (ids.has(rule.id)) {
      throw new PolicyError(
        "DUPLICATE_RULE_ID",
        `Duplicate rule id: ${rule.id}.`,
        "$.rules",
      );
    }
    ids.add(rule.id);
  }

  const normalized = JSON.parse(
    canonicalize({ policyId, version, rules }),
  ) as PolicyDocument;
  return normalized;
}

function hashValidatedPolicy(policy: PolicyDocument): string {
  const canonical = canonicalize({
    domain: POLICY_HASH_DOMAIN,
    policy,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function calculatePolicyHash(value: unknown): string {
  return hashValidatedPolicy(validatePolicyDocument(value));
}

export function loadPolicy(value: unknown): LoadedPolicy {
  const policy = validatePolicyDocument(value);
  return {
    policy,
    policyHash: hashValidatedPolicy(policy),
  };
}

export function parsePolicyJson(text: string): LoadedPolicy {
  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    throw new PolicyError("INVALID_POLICY", "Policy JSON could not be parsed.");
  }
  return loadPolicy(value);
}
