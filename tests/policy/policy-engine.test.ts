import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canonicalize } from "../../src/protocol/canonicalize.ts";
import { aggregateRuleResults } from "../../src/policy/aggregate.ts";
import { evaluatePolicy, evaluateRule } from "../../src/policy/evaluate.ts";
import {
  calculatePolicyHash,
  loadPolicy,
  parsePolicyJson,
} from "../../src/policy/load-policy.ts";
import type {
  HumanApprovalRule,
  PolicyDocument,
  PolicyInput,
  PolicyRule,
  PolicyRuleResult,
} from "../../src/policy/types.ts";

const policyText = readFileSync(
  new URL("../../policies/github-demo-policy.json", import.meta.url),
  "utf8",
);
const loaded = parsePolicyJson(policyText);
const policy = loaded.policy;

const baseInput: PolicyInput = {
  targetPaths: ["demo/target.md"],
  changedFileCount: 1,
  proposalText: "bounded synthetic proposal",
  approvalState: "REQUIRED_APPROVED",
};

function findRule(id: string, source: PolicyDocument = policy): PolicyRule {
  const rule = source.rules.find((candidate) => candidate.id === id);
  assert.ok(rule, `missing rule ${id}`);
  return rule;
}

function fakeResult(value: PolicyRuleResult["result"]): PolicyRuleResult {
  return {
    ruleId: `r-${value}`,
    ruleType: "SECRET_SCAN",
    result: value,
    reasonCode: value,
    details: {},
  };
}

test("1 all PASS aggregates to ALLOW", () => {
  assert.equal(evaluatePolicy(policy, baseInput).verdict, "ALLOW");
});

test("2 one FAIL aggregates to BLOCK", () => {
  assert.equal(
    aggregateRuleResults([fakeResult("PASS"), fakeResult("FAIL")]),
    "BLOCK",
  );
});

test("3 FAIL plus UNKNOWN aggregates to BLOCK", () => {
  assert.equal(
    aggregateRuleResults([fakeResult("UNKNOWN"), fakeResult("FAIL")]),
    "BLOCK",
  );
});

test("4 UNKNOWN with no FAIL aggregates to ESCALATE", () => {
  assert.equal(
    aggregateRuleResults([fakeResult("PASS"), fakeResult("UNKNOWN")]),
    "ESCALATE",
  );
});

test("5 rule order does not change aggregate verdict", () => {
  const forward = [fakeResult("PASS"), fakeResult("UNKNOWN"), fakeResult("PASS")];
  assert.equal(aggregateRuleResults(forward), aggregateRuleResults([...forward].reverse()));
});

test("6 allowed demo path passes allowlist", () => {
  const result = evaluateRule(findRule("path-allowlist"), baseInput);
  assert.equal(result.result, "PASS");
});

test("7 path outside demo allowlist fails", () => {
  const result = evaluateRule(findRule("path-allowlist"), {
    ...baseInput,
    targetPaths: ["src/protocol/types.ts"],
  });
  assert.equal(result.result, "FAIL");
});

test("8 .env is denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: [".env"] }).result,
    "FAIL",
  );
});

test("9 .env.* is denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: [".env.local"] }).result,
    "FAIL",
  );
});

test("10 .git descendants are denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: [".git/config"] }).result,
    "FAIL",
  );
});

test("11 .github descendants are denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: [".github/workflows/x.yml"] }).result,
    "FAIL",
  );
});

test("12 src/hedera descendants are denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: ["src/hedera/client.ts"] }).result,
    "FAIL",
  );
});

test("13 receipts/private descendants are denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: ["receipts/private/x.json"] }).result,
    "FAIL",
  );
});

test("14 demo/protected descendants are denied", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: ["demo/protected/immutable.txt"] }).result,
    "FAIL",
  );
});

test("15 denied path still fails when also allowlisted", () => {
  const evaluation = evaluatePolicy(policy, {
    ...baseInput,
    targetPaths: ["demo/protected/immutable.txt"],
  });
  assert.equal(evaluation.ruleResults.find((entry) => entry.ruleId === "path-allowlist")?.result, "PASS");
  assert.equal(evaluation.ruleResults.find((entry) => entry.ruleId === "path-denylist")?.result, "FAIL");
  assert.equal(evaluation.verdict, "BLOCK");
});

test("16 absolute path fails closed", () => {
  assert.equal(
    evaluateRule(findRule("path-allowlist"), { ...baseInput, targetPaths: ["/demo/target.md"] }).result,
    "FAIL",
  );
});

test("17 traversal path fails closed", () => {
  assert.equal(
    evaluateRule(findRule("path-allowlist"), { ...baseInput, targetPaths: ["demo/../target.md"] }).result,
    "FAIL",
  );
});

test("18 backslash cannot bypass deny rule", () => {
  assert.equal(
    evaluateRule(findRule("path-denylist"), { ...baseInput, targetPaths: ["demo\\protected\\immutable.txt"] }).result,
    "FAIL",
  );
});

test("19 obvious synthetic secret marker fails", () => {
  assert.equal(
    evaluateRule(findRule("secret-scan"), { ...baseInput, proposalText: "SYNTHETIC_PRIVATE_KEY" }).result,
    "FAIL",
  );
});

test("20 clean bounded proposal passes secret rule", () => {
  assert.equal(evaluateRule(findRule("secret-scan"), baseInput).result, "PASS");
});

test("21 missing scan material is UNKNOWN", () => {
  const { proposalText: _proposalText, ...input } = baseInput;
  assert.equal(evaluateRule(findRule("secret-scan"), input).result, "UNKNOWN");
});

test("22 changedFileCount at limit passes", () => {
  assert.equal(evaluateRule(findRule("change-count"), baseInput).result, "PASS");
});

test("23 changedFileCount above limit fails", () => {
  assert.equal(
    evaluateRule(findRule("change-count"), { ...baseInput, changedFileCount: 2 }).result,
    "FAIL",
  );
});

test("24 missing changedFileCount is UNKNOWN", () => {
  const { changedFileCount: _changedFileCount, ...input } = baseInput;
  assert.equal(evaluateRule(findRule("change-count"), input).result, "UNKNOWN");
});

test("25 required approval approved passes", () => {
  assert.equal(evaluateRule(findRule("human-approval"), baseInput).result, "PASS");
});

test("26 required approval pending is UNKNOWN", () => {
  assert.equal(
    evaluateRule(findRule("human-approval"), { ...baseInput, approvalState: "REQUIRED_PENDING" }).result,
    "UNKNOWN",
  );
});

test("27 required approval rejected fails", () => {
  assert.equal(
    evaluateRule(findRule("human-approval"), { ...baseInput, approvalState: "REQUIRED_REJECTED" }).result,
    "FAIL",
  );
});

test("28 INVALID approval fails", () => {
  assert.equal(
    evaluateRule(findRule("human-approval"), { ...baseInput, approvalState: "INVALID" }).result,
    "FAIL",
  );
});

test("29 non-required approval passes", () => {
  const rule: HumanApprovalRule = {
    id: "optional-approval",
    type: "HUMAN_APPROVAL",
    required: false,
  };
  assert.equal(evaluateRule(rule, {}).result, "PASS");
});

test("30 policy hash is reproducible under object-key reordering", () => {
  const reordered = {
    rules: policy.rules.map((rule) => {
      if (rule.type === "CHANGE_COUNT") {
        return { maxChangedFiles: rule.maxChangedFiles, type: rule.type, id: rule.id };
      }
      if (rule.type === "HUMAN_APPROVAL") {
        return { required: rule.required, type: rule.type, id: rule.id };
      }
      if (rule.type === "SECRET_SCAN") {
        return { mode: rule.mode, type: rule.type, id: rule.id };
      }
      return { patterns: [...rule.patterns], type: rule.type, id: rule.id };
    }),
    version: policy.version,
    policyId: policy.policyId,
  };
  assert.equal(calculatePolicyHash(policy), calculatePolicyHash(reordered));
});

test("31 policy mutation changes policy hash", () => {
  const mutated = structuredClone(policy);
  const change = mutated.rules.find((rule) => rule.type === "CHANGE_COUNT");
  assert.ok(change && change.type === "CHANGE_COUNT");
  change.maxChangedFiles = 2;
  assert.notEqual(calculatePolicyHash(policy), calculatePolicyHash(mutated));
});

test("32 duplicate rule ID is rejected", () => {
  const duplicate = structuredClone(policy);
  duplicate.rules[1]!.id = duplicate.rules[0]!.id;
  assert.throws(() => loadPolicy(duplicate), /Duplicate rule id/u);
});

test("33 unknown rule type is rejected", () => {
  const unknown = structuredClone(policy) as unknown as { rules: Array<Record<string, unknown>> };
  unknown.rules[0]!.type = "UNKNOWN_RULE";
  assert.throws(() => loadPolicy(unknown), /Unknown rule type/u);
});

test("34 malformed path rule is rejected", () => {
  const malformed = structuredClone(policy);
  const allow = malformed.rules.find((rule) => rule.type === "PATH_ALLOWLIST");
  assert.ok(allow && allow.type === "PATH_ALLOWLIST");
  allow.patterns = ["../demo/**"];
  assert.throws(() => loadPolicy(malformed), /Invalid repository-relative path pattern/u);
});

test("35 malformed change-count rule is rejected", () => {
  const malformed = structuredClone(policy);
  const change = malformed.rules.find((rule) => rule.type === "CHANGE_COUNT");
  assert.ok(change && change.type === "CHANGE_COUNT");
  change.maxChangedFiles = -1;
  assert.throws(() => loadPolicy(malformed), /non-negative integer/u);
});

test("36 same policy and input produce byte-equivalent result", () => {
  const first = evaluatePolicy(policy, baseInput);
  const second = evaluatePolicy(policy, structuredClone(baseInput));
  assert.deepEqual(first, second);
  assert.equal(canonicalize(first), canonicalize(second));
});

test("37 hidden override or bypass fields are rejected", () => {
  const bypass = {
    ...structuredClone(policy),
    administratorOverride: true,
  };
  assert.throws(() => loadPolicy(bypass), /Override\/bypass fields/u);
});
