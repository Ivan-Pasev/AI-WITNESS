import type { PolicyRuleResult, PolicyVerdict } from "./types.ts";

export function aggregateRuleResults(
  ruleResults: readonly PolicyRuleResult[],
): PolicyVerdict {
  if (ruleResults.some((result) => result.result === "FAIL")) {
    return "BLOCK";
  }

  if (ruleResults.some((result) => result.result === "UNKNOWN")) {
    return "ESCALATE";
  }

  return "ALLOW";
}
