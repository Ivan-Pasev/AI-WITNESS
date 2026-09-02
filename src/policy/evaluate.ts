import type { JsonObject } from "../protocol/types.ts";
import { aggregateRuleResults } from "./aggregate.ts";
import { loadPolicy } from "./load-policy.ts";
import type {
  HumanApprovalRule,
  PathRule,
  PolicyDocument,
  PolicyEvaluation,
  PolicyInput,
  PolicyRule,
  PolicyRuleResult,
  SecretScanRule,
  ChangeCountRule,
} from "./types.ts";

const SECRET_SIGNATURES = [
  ["PRIVATE_KEY_HEADER", "BEGIN PRIVATE KEY"],
  ["DEMO_SECRET_MARKER", "DEMO_SECRET"],
  ["SYNTHETIC_PRIVATE_KEY_MARKER", "SYNTHETIC_PRIVATE_KEY"],
] as const;

function result(
  rule: PolicyRule,
  value: PolicyRuleResult["result"],
  reasonCode: string,
  details: JsonObject = {},
): PolicyRuleResult {
  return {
    ruleId: rule.id,
    ruleType: rule.type,
    result: value,
    reasonCode,
    details,
  };
}

function pathProblem(path: string): string | null {
  if (path.length === 0) return "EMPTY_PATH";
  if (path.includes("\\")) return "BACKSLASH_NOT_CANONICAL";
  if (path.startsWith("/") || /^[A-Za-z]:\//u.test(path)) return "ABSOLUTE_PATH";
  const segments = path.split("/");
  if (segments.some((segment) => segment.length === 0)) return "EMPTY_SEGMENT";
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return "TRAVERSAL_SEGMENT";
  }
  return null;
}

export function matchesPathPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/**")) {
    const root = pattern.slice(0, -3);
    return path === root || path.startsWith(`${root}/`);
  }
  if (pattern.endsWith(".*")) {
    const prefix = pattern.slice(0, -1);
    return path.startsWith(prefix) && path.length > prefix.length;
  }
  return path === pattern;
}

function extractPaths(input: PolicyInput):
  | { state: "MISSING" }
  | { state: "INVALID"; invalidPaths: string[] }
  | { state: "KNOWN"; paths: string[] } {
  if (!Array.isArray(input.targetPaths) || input.targetPaths.length === 0) {
    return { state: "MISSING" };
  }
  const invalidPaths: string[] = [];
  const paths: string[] = [];
  for (const entry of input.targetPaths) {
    if (typeof entry !== "string") {
      invalidPaths.push("<NON_STRING_PATH>");
      continue;
    }
    const problem = pathProblem(entry);
    if (problem !== null) {
      invalidPaths.push(`${entry}:${problem}`);
      continue;
    }
    paths.push(entry);
  }
  if (invalidPaths.length > 0) {
    return { state: "INVALID", invalidPaths };
  }
  return { state: "KNOWN", paths };
}

function evaluatePathAllowlist(
  rule: PathRule,
  input: PolicyInput,
): PolicyRuleResult {
  const extracted = extractPaths(input);
  if (extracted.state === "MISSING") {
    return result(rule, "UNKNOWN", "TARGET_PATHS_MISSING");
  }
  if (extracted.state === "INVALID") {
    return result(rule, "FAIL", "INVALID_TARGET_PATH", {
      invalidPaths: extracted.invalidPaths,
    });
  }
  const disallowed = extracted.paths.filter(
    (path) => !rule.patterns.some((pattern) => matchesPathPattern(path, pattern)),
  );
  if (disallowed.length > 0) {
    return result(rule, "FAIL", "PATH_OUTSIDE_ALLOWLIST", { disallowed });
  }
  return result(rule, "PASS", "ALL_PATHS_ALLOWED", {
    checkedPathCount: extracted.paths.length,
  });
}

function evaluatePathDenylist(
  rule: PathRule,
  input: PolicyInput,
): PolicyRuleResult {
  const extracted = extractPaths(input);
  if (extracted.state === "MISSING") {
    return result(rule, "UNKNOWN", "TARGET_PATHS_MISSING");
  }
  if (extracted.state === "INVALID") {
    return result(rule, "FAIL", "INVALID_TARGET_PATH", {
      invalidPaths: extracted.invalidPaths,
    });
  }
  const denied = extracted.paths.filter((path) =>
    rule.patterns.some((pattern) => matchesPathPattern(path, pattern)),
  );
  if (denied.length > 0) {
    return result(rule, "FAIL", "DENIED_PATH_MATCH", { denied });
  }
  return result(rule, "PASS", "NO_DENIED_PATH_MATCH", {
    checkedPathCount: extracted.paths.length,
  });
}

function evaluateSecretScan(
  rule: SecretScanRule,
  input: PolicyInput,
): PolicyRuleResult {
  if (typeof input.proposalText !== "string") {
    return result(rule, "UNKNOWN", "SCAN_MATERIAL_MISSING");
  }
  const upper = input.proposalText.toUpperCase();
  const matchedSignatures = SECRET_SIGNATURES.filter(([, marker]) =>
    upper.includes(marker),
  ).map(([signature]) => signature);
  if (matchedSignatures.length > 0) {
    return result(rule, "FAIL", "SYNTHETIC_SECRET_MARKER_DETECTED", {
      matchedSignatures,
    });
  }
  return result(rule, "PASS", "NO_FROZEN_MARKER_DETECTED", {
    scannerMode: rule.mode,
  });
}

function evaluateChangeCount(
  rule: ChangeCountRule,
  input: PolicyInput,
): PolicyRuleResult {
  const count = input.changedFileCount;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
    return result(rule, "UNKNOWN", "CHANGE_COUNT_UNEVALUABLE");
  }
  if (count > rule.maxChangedFiles) {
    return result(rule, "FAIL", "CHANGE_COUNT_EXCEEDED", {
      changedFileCount: count,
      maxChangedFiles: rule.maxChangedFiles,
    });
  }
  return result(rule, "PASS", "CHANGE_COUNT_WITHIN_LIMIT", {
    changedFileCount: count,
    maxChangedFiles: rule.maxChangedFiles,
  });
}

function evaluateHumanApproval(
  rule: HumanApprovalRule,
  input: PolicyInput,
): PolicyRuleResult {
  if (!rule.required) {
    return result(rule, "PASS", "APPROVAL_NOT_REQUIRED");
  }
  switch (input.approvalState) {
    case "REQUIRED_APPROVED":
      return result(rule, "PASS", "REQUIRED_APPROVAL_RECORDED");
    case "REQUIRED_PENDING":
      return result(rule, "UNKNOWN", "REQUIRED_APPROVAL_PENDING");
    case "REQUIRED_REJECTED":
      return result(rule, "FAIL", "REQUIRED_APPROVAL_REJECTED");
    case "INVALID":
      return result(rule, "FAIL", "APPROVAL_STATE_INVALID");
    case "NOT_REQUIRED":
    case undefined:
      return result(rule, "UNKNOWN", "REQUIRED_APPROVAL_NOT_EVALUABLE");
    default:
      return result(rule, "UNKNOWN", "REQUIRED_APPROVAL_NOT_EVALUABLE");
  }
}

export function evaluateRule(
  rule: PolicyRule,
  input: PolicyInput,
): PolicyRuleResult {
  switch (rule.type) {
    case "PATH_ALLOWLIST":
      return evaluatePathAllowlist(rule, input);
    case "PATH_DENYLIST":
      return evaluatePathDenylist(rule, input);
    case "SECRET_SCAN":
      return evaluateSecretScan(rule, input);
    case "CHANGE_COUNT":
      return evaluateChangeCount(rule, input);
    case "HUMAN_APPROVAL":
      return evaluateHumanApproval(rule, input);
  }
}

export function evaluatePolicy(
  policyValue: PolicyDocument | unknown,
  input: PolicyInput,
): PolicyEvaluation {
  const loaded = loadPolicy(policyValue);
  const ruleResults = loaded.policy.rules.map((rule) => evaluateRule(rule, input));
  return {
    policyId: loaded.policy.policyId,
    policyVersion: loaded.policy.version,
    policyHash: loaded.policyHash,
    ruleResults,
    verdict: aggregateRuleResults(ruleResults),
  };
}
