import { createHash } from "node:crypto";

import {
  Client,
  PrivateKey,
  TopicMessageSubmitTransaction,
} from "@hiero-ledger/sdk";

import { canonicalize } from "../protocol/canonicalize.ts";
import type {
  JsonObject,
  ReceiptEnvelope,
} from "../protocol/types.ts";
import {
  ANCHOR_RECEIPT_KINDS,
  type PublicAnchorPayload,
  type SubmittedAnchor,
} from "./types.ts";

export const PUBLIC_MANIFEST_HASH_DOMAIN = "IRP1:PUBLIC_MANIFEST" as const;
const HASH_RE = /^[0-9a-f]{64}$/u;
const EXACT_ANCHOR_KEYS = [
  "protocol",
  "schemaVersion",
  "receiptId",
  "receiptKind",
  "receiptHash",
  "previousReceiptHash",
  "publicManifestHash",
] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertDigest(value: unknown, name: string): asserts value is string {
  if (typeof value !== "string" || !HASH_RE.test(value)) {
    throw new Error(`${name} must be a lowercase 64-hex SHA-256 digest.`);
  }
}

function assertPublicReceiptId(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("receiptId must be a non-empty string.");
  }
  if (
    value.includes("/") ||
    value.includes("\\") ||
    /^[A-Za-z]:/u.test(value)
  ) {
    throw new Error("receiptId must not contain filesystem-like path material.");
  }
}

export function calculatePublicManifestHash(manifest: JsonObject): string {
  const canonical = canonicalize({
    domain: PUBLIC_MANIFEST_HASH_DOMAIN,
    manifest,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function buildAnchorPayload(
  receipt: ReceiptEnvelope,
  publicManifest: JsonObject,
): PublicAnchorPayload {
  if (!ANCHOR_RECEIPT_KINDS.includes(receipt.receiptKind as never)) {
    throw new Error("IRP-1 Hedera public-proof profile anchors W2/W3 receipts only.");
  }
  if (receipt.previousReceiptHash === null) {
    throw new Error("Anchored W2/W3 receipt must have a previousReceiptHash.");
  }
  return {
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptId: receipt.receiptId,
    receiptKind: receipt.receiptKind as PublicAnchorPayload["receiptKind"],
    receiptHash: receipt.receiptHash,
    previousReceiptHash: receipt.previousReceiptHash,
    publicManifestHash: calculatePublicManifestHash(publicManifest),
  };
}

export function parseAnchorPayload(value: unknown): PublicAnchorPayload {
  if (!isObject(value)) {
    throw new Error("Anchor payload must be an object.");
  }
  const actualKeys = Object.keys(value).sort();
  const expectedKeys = [...EXACT_ANCHOR_KEYS].sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index])
  ) {
    throw new Error("Anchor payload must contain exactly the minimized public field set.");
  }
  if (value.protocol !== "IRP-1" || value.schemaVersion !== "1") {
    throw new Error("Anchor protocol/schema identity mismatch.");
  }
  if (
    typeof value.receiptKind !== "string" ||
    !ANCHOR_RECEIPT_KINDS.includes(
      value.receiptKind as (typeof ANCHOR_RECEIPT_KINDS)[number],
    )
  ) {
    throw new Error("Anchor receiptKind must be W2_AUTHORIZATION or W3_OUTCOME.");
  }
  assertPublicReceiptId(value.receiptId);
  assertDigest(value.receiptHash, "receiptHash");
  assertDigest(value.previousReceiptHash, "previousReceiptHash");
  assertDigest(value.publicManifestHash, "publicManifestHash");
  return {
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptId: value.receiptId,
    receiptKind: value.receiptKind as PublicAnchorPayload["receiptKind"],
    receiptHash: value.receiptHash,
    previousReceiptHash: value.previousReceiptHash,
    publicManifestHash: value.publicManifestHash,
  };
}

export function canonicalAnchorPayload(payload: PublicAnchorPayload): string {
  return canonicalize(parseAnchorPayload(payload));
}

export async function submitAnchor(
  client: Client,
  topicId: string,
  submitKey: PrivateKey,
  payload: PublicAnchorPayload,
): Promise<SubmittedAnchor> {
  const frozen = await new TopicMessageSubmitTransaction()
    .setTopicId(topicId)
    .setMessage(canonicalAnchorPayload(payload))
    .freezeWith(client)
    .sign(submitKey);
  const response = await frozen.execute(client);
  const receipt = await response.getReceipt(client);
  if (receipt.topicSequenceNumber === null) {
    throw new Error("HOLD_W2_ANCHOR_FAILED: HCS receipt did not contain a sequence number.");
  }
  const sequenceNumber = Number(receipt.topicSequenceNumber.toString());
  if (!Number.isSafeInteger(sequenceNumber) || sequenceNumber <= 0) {
    throw new Error("HCS receipt returned an invalid sequence number.");
  }
  return { topicId, sequenceNumber };
}
