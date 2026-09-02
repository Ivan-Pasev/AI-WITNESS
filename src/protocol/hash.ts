import { createHash } from "node:crypto";

import { canonicalize } from "./canonicalize.ts";
import {
  PROTOCOL,
  SCHEMA_VERSION,
  type JsonObject,
  type ReceiptDraft,
  type ReceiptEnvelope,
  type ReceiptKind,
} from "./types.ts";

export const DOMAIN_SEPARATORS: Readonly<Record<ReceiptKind, string>> = {
  W0_OBSERVATION: "IRP1:OBSERVATION",
  W1_INTENT: "IRP1:INTENT",
  W2_AUTHORIZATION: "IRP1:AUTHORIZATION",
  W3_OUTCOME: "IRP1:OUTCOME",
};

export function buildReceiptHashPreimage(
  receipt: ReceiptDraft | ReceiptEnvelope,
): JsonObject {
  return {
    domain: DOMAIN_SEPARATORS[receipt.receiptKind],
    protocol: PROTOCOL,
    schemaVersion: SCHEMA_VERSION,
    receiptKind: receipt.receiptKind,
    previousReceiptHash: receipt.previousReceiptHash,
    body: {
      receiptId: receipt.receiptId,
      sessionId: receipt.sessionId,
      nonce: receipt.nonce,
      createdAt: receipt.createdAt,
      payload: receipt.payload,
    },
  };
}

export function calculateReceiptHash(
  receipt: ReceiptDraft | ReceiptEnvelope,
): string {
  const canonical = canonicalize(buildReceiptHashPreimage(receipt));
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function verifyReceiptHash(receipt: ReceiptEnvelope): boolean {
  return calculateReceiptHash(receipt) === receipt.receiptHash;
}
