import type { ApprovalState, JsonObject } from "../protocol/types.ts";

export const RULE_RESULTS = ["PASS", "FAIL", "UNKNOWN"] as const;
export type RuleResult = (typeof RULE_RESULTS)[number];

export const POLICY_VERDICTS = ["ALLOW", "BLOCK", "ESCALATE"] as const;
export type PolicyVerdict = (typeof POLICY_VERDICTS)[number];

export const POLICY_RULE_TYPES = [
  "PATH_ALLOWLIST",
  "PATH_DENYLIST",
  "SECRET_SCAN",
  "CHANGE_COUNT",
  "HUMAN_APPROVAL",
] as const;
export type PolicyRuleType = (typeof POLICY_RULE_TYPES)[number];

export interface PathRule {
  id: string;
  type: "PATH_ALLOWLIST" | "PATH_DENYLIST";
  patterns: string[];
}

export interface SecretScanRule {
  id: string;
  type: "SECRET_SCAN";
  mode: "DEMO_HEURISTIC";
}

export interface ChangeCountRule {
  id: string;
  type: "CHANGE_COUNT";
  maxChangedFiles: number;
}

export interface HumanApprovalRule {
  id: string;
  type: "HUMAN_APPROVAL";
  required: boolean;
}

export type PolicyRule =
  | PathRule
  | SecretScanRule
  | ChangeCountRule
  | HumanApprovalRule;

export interface PolicyDocument {
  policyId: string;
  version: string;
  rules: PolicyRule[];
}

export interface LoadedPolicy {
  policy: PolicyDocument;
  policyHash: string;
}

export interface PolicyInput {
  targetPaths?: readonly string[];
  changedFileCount?: number;
  proposalText?: string;
  approvalState?: ApprovalState;
}

export interface PolicyRuleResult {
  ruleId: string;
  ruleType: PolicyRuleType;
  result: RuleResult;
  reasonCode: string;
  details: JsonObject;
}

export interface PolicyEvaluation {
  policyId: string;
  policyVersion: string;
  policyHash: string;
  ruleResults: PolicyRuleResult[];
  verdict: PolicyVerdict;
}

export type PolicyErrorCode =
  | "INVALID_POLICY"
  | "DUPLICATE_RULE_ID"
  | "UNKNOWN_RULE_TYPE"
  | "MALFORMED_RULE"
  | "BYPASS_FIELD_REJECTED";

export class PolicyError extends Error {
  readonly code: PolicyErrorCode;
  readonly path?: string;

  constructor(code: PolicyErrorCode, message: string, path?: string) {
    super(message);
    this.name = "PolicyError";
    this.code = code;
    this.path = path;
  }
}
