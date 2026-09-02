import type { JsonObject, ReceiptEnvelope } from "../../src/protocol/types.ts";
import type { PolicyEvaluation } from "../../src/policy/types.ts";
import type { DemoState } from "../executors/types.ts";

export type DemoCaseId =
  | "ALLOW_AND_MATCH"
  | "BLOCK_AND_NOT_EXECUTED"
  | "ALLOW_BUT_DIVERGED";

export interface DemoCaseDefinition {
  id: DemoCaseId;
  slug: string;
  mode: "MATCH" | "BLOCK" | "DIVERGE";
  sessionId: string;
  targetPath: string;
  appendText: string;
  proposalText: string;
  interpretation: string;
  extraText?: string;
  receiptIds: readonly [string, string, string, string];
  nonces: readonly [string, string, string, string];
  createdAt: readonly [string, string, string, string];
}

export interface DemoCaseResult {
  definition: DemoCaseDefinition;
  beforeState: DemoState;
  afterState: DemoState;
  requestedActionManifest: JsonObject;
  actualActionManifest: JsonObject;
  policyEvaluation: PolicyEvaluation;
  receipts: readonly [
    ReceiptEnvelope,
    ReceiptEnvelope,
    ReceiptEnvelope,
    ReceiptEnvelope,
  ];
  verdict: JsonObject;
}
