import { createReceipt } from "../../src/protocol/create-receipt.ts";
import type { JsonObject } from "../../src/protocol/types.ts";
import { executeBlocked } from "../executors/blocked-executor.ts";
import { executeDivergentAppend } from "../executors/divergent-executor.ts";
import { executeExactAppend } from "../executors/exact-executor.ts";
import { buildPreExecutionCase, CASE_DEFINITIONS } from "./build-case.ts";
import { compareActionManifests, stateHash } from "./compare-action.ts";
import type { DemoCaseResult } from "./types.ts";

export function runDemoCase(slug: string): DemoCaseResult {
  const definition = CASE_DEFINITIONS[slug];
  if (definition === undefined) {
    throw new Error(`Unknown demo case: ${slug}`);
  }

  const pre = buildPreExecutionCase(definition);
  const execution =
    definition.mode === "MATCH"
      ? executeExactAppend(
          pre.beforeState,
          definition.targetPath,
          definition.appendText,
        )
      : definition.mode === "BLOCK"
        ? executeBlocked(pre.beforeState)
        : executeDivergentAppend(
            pre.beforeState,
            definition.targetPath,
            definition.appendText,
            "demo/adversarial-extra.md",
            definition.extraText!,
          );

  const authorizationManifest =
    pre.w2.payload.authorizedActionManifest as JsonObject;
  const correspondence = compareActionManifests(
    authorizationManifest,
    execution.actualActionManifest,
    execution.executionState,
  );

  const violations: JsonObject[] =
    definition.mode === "DIVERGE"
      ? [
          {
            code: "UNAUTHORIZED_EXTRA_PATH",
            path: "demo/adversarial-extra.md",
          },
        ]
      : [];

  const w3 = createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W3_OUTCOME",
    receiptId: definition.receiptIds[3],
    sessionId: definition.sessionId,
    nonce: definition.nonces[3],
    createdAt: definition.createdAt[3],
    previousReceiptHash: pre.w2.receiptHash,
    payload: {
      authorizationReceiptHash: pre.w2.receiptHash,
      executionState: execution.executionState,
      actualActionManifest: execution.actualActionManifest,
      observedResult: {
        beforeStateHash: stateHash(pre.beforeState),
        afterStateHash: stateHash(execution.state),
        mutated: stateHash(pre.beforeState) !== stateHash(execution.state),
      },
      correspondenceVerdict: correspondence,
      violations,
      residualUnknowns: ["semantic correctness remains outside IRP-1"],
    },
  });

  const approval = "REQUIRED_AND_APPROVED";
  const authorization = pre.w2.payload.authorizationVerdict as string;

  return {
    definition,
    beforeState: pre.beforeState,
    afterState: execution.state,
    requestedActionManifest: pre.requestedActionManifest,
    actualActionManifest: execution.actualActionManifest,
    policyEvaluation: pre.policyEvaluation,
    receipts: [pre.w0, pre.w1, pre.w2, w3],
    verdict: {
      caseId: definition.id,
      chain: "CHAIN_VALID",
      policy: pre.policyEvaluation.verdict,
      approval,
      authorization,
      execution: execution.executionState,
      correspondence,
      hederaEvidence: "NONE",
    },
  };
}
