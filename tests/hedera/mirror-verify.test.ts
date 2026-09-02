import assert from "node:assert/strict";
import { test } from "node:test";

import { canonicalAnchorPayload } from "../../src/hedera/anchor.ts";
import {
  mirrorMessagePath,
  parseMirrorTopicMessage,
  validateMirrorBase,
} from "../../src/hedera/mirror-query.ts";
import type { PublicAnchorPayload } from "../../src/hedera/types.ts";
import { verifyMirrorAnchor } from "../../src/hedera/verify-anchor.ts";

const payload: PublicAnchorPayload = {
  protocol: "IRP-1",
  schemaVersion: "1",
  receiptId: "p5-test-w2",
  receiptKind: "W2_AUTHORIZATION",
  receiptHash: "a".repeat(64),
  previousReceiptHash: "b".repeat(64),
  publicManifestHash: "c".repeat(64),
};

function mirror(overrides: Record<string, unknown> = {}) {
  return parseMirrorTopicMessage({
    topic_id: "0.0.1234",
    sequence_number: 7,
    consensus_timestamp: "1788381300.123456789",
    message: Buffer.from(canonicalAnchorPayload(payload), "utf8").toString("base64"),
    ...overrides,
  });
}

test("official testnet mirror base is accepted and normalized", () => {
  assert.equal(
    validateMirrorBase("https://testnet.mirrornode.hedera.com/"),
    "https://testnet.mirrornode.hedera.com",
  );
});

test("non-testnet or path-bearing mirror base is rejected", () => {
  assert.throws(() => validateMirrorBase("https://mainnet-public.mirrornode.hedera.com"));
  assert.throws(() => validateMirrorBase("https://testnet.mirrornode.hedera.com/api/v1"));
});

test("mirror message path is deterministic", () => {
  assert.equal(mirrorMessagePath("0.0.1234", 7), "/api/v1/topics/0.0.1234/messages/7");
});

test("malformed mirror response is rejected", () => {
  assert.throws(() => parseMirrorTopicMessage({ topic_id: "bad" }));
});

test("missing consensus timestamp is rejected", () => {
  assert.throws(() =>
    parseMirrorTopicMessage({
      topic_id: "0.0.1234",
      sequence_number: 7,
      consensus_timestamp: "",
      message: "e30=",
    }),
  );
});

test("NOT_FOUND is distinct from ANCHORED", () => {
  assert.equal(verifyMirrorAnchor("0.0.1234", 7, payload, null).verdict, "NOT_FOUND");
});

test("topic mismatch is surfaced", () => {
  assert.equal(verifyMirrorAnchor("0.0.9999", 7, payload, mirror()).verdict, "TOPIC_MISMATCH");
});

test("sequence mismatch is surfaced", () => {
  assert.equal(verifyMirrorAnchor("0.0.1234", 8, payload, mirror()).verdict, "SEQUENCE_MISMATCH");
});

test("malformed base64 payload produces MIRROR_ERROR", () => {
  const message = mirror();
  const malformed = { ...message, messageBase64: "not base64" };
  assert.equal(verifyMirrorAnchor("0.0.1234", 7, payload, malformed).verdict, "MIRROR_ERROR");
});

test("receipt hash mismatch is surfaced", () => {
  const altered = { ...payload, receiptHash: "d".repeat(64) };
  const message = mirror({
    message: Buffer.from(canonicalAnchorPayload(altered), "utf8").toString("base64"),
  });
  assert.equal(verifyMirrorAnchor("0.0.1234", 7, payload, message).verdict, "HASH_MISMATCH");
});

test("manifest hash mismatch is surfaced", () => {
  const altered = { ...payload, publicManifestHash: "d".repeat(64) };
  const message = mirror({
    message: Buffer.from(canonicalAnchorPayload(altered), "utf8").toString("base64"),
  });
  assert.equal(verifyMirrorAnchor("0.0.1234", 7, payload, message).verdict, "HASH_MISMATCH");
});

test("non-hash payload mismatch is surfaced independently", () => {
  const altered = { ...payload, receiptId: "p5-other-w2" };
  const message = mirror({
    message: Buffer.from(canonicalAnchorPayload(altered), "utf8").toString("base64"),
  });
  assert.equal(verifyMirrorAnchor("0.0.1234", 7, payload, message).verdict, "PAYLOAD_MISMATCH");
});

test("ANCHORED requires full topic, sequence, timestamp, payload, and hash equality", () => {
  const verification = verifyMirrorAnchor("0.0.1234", 7, payload, mirror());
  assert.equal(verification.verdict, "ANCHORED");
  assert.equal(verification.consensusTimestamp, "1788381300.123456789");
  assert.deepEqual(verification.decodedPayload, payload);
});
