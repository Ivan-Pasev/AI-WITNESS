import type { JsonObject } from "../../src/protocol/types.ts";
import { canonicalize } from "../../src/protocol/canonicalize.ts";
import { sha256Text } from "./compare-action.ts";
import type { DemoCaseResult } from "./types.ts";

export interface PublicBundle {
  receipts: DemoCaseResult["receipts"];
  policyEvaluation: JsonObject;
  manifest: JsonObject;
  expectedVerdict: JsonObject;
}

export function buildPublicBundle(result: DemoCaseResult): PublicBundle {
  const receiptRefs = result.receipts.map((receipt) => ({
    receiptId: receipt.receiptId,
    receiptKind: receipt.receiptKind,
    receiptHash: receipt.receiptHash,
  }));

  return {
    receipts: result.receipts,
    policyEvaluation: {
      policyId: result.policyEvaluation.policyId,
      policyVersion: result.policyEvaluation.policyVersion,
      policyHash: result.policyEvaluation.policyHash,
      ruleResults: result.policyEvaluation.ruleResults.map((entry) => ({
        ruleId: entry.ruleId,
        ruleType: entry.ruleType,
        result: entry.result,
        reasonCode: entry.reasonCode,
        details: entry.details,
      })),
      verdict: result.policyEvaluation.verdict,
    },
    manifest: {
      caseId: result.definition.id,
      protocol: "IRP-1",
      schemaVersion: "1",
      receipts: receiptRefs,
      policy: {
        policyId: result.policyEvaluation.policyId,
        version: result.policyEvaluation.policyVersion,
        policyHash: result.policyEvaluation.policyHash,
      },
      generationProfile: "IRP-1-PHASE4-DETERMINISTIC-v1",
      publicBundleDescriptorHash: sha256Text(
        canonicalize({
          caseId: result.definition.id,
          receiptHashes: result.receipts.map((receipt) => receipt.receiptHash),
          policyHash: result.policyEvaluation.policyHash,
        }),
      ),
    },
    expectedVerdict: result.verdict,
  };
}
