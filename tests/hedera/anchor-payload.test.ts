import assert from "node:assert/strict";
import { test } from "node:test";

import { createReceipt } from "../../src/protocol/create-receipt.ts";
import type { JsonObject } from "../../src/protocol/types.ts";
import {
  buildAnchorPayload,
  calculatePublicManifestHash,
  canonicalAnchorPayload,
  parseAnchorPayload,
} from "../../src/hedera/anchor.ts";

const HASH = "a".repeat(64);
const PREV = "b".repeat(64);
const manifest: JsonObject = {
  profile: "IRP-1-HEDERA-TESTNET-P5-A-v1",
  caseId: "ALLOW_AND_MATCH",
  anchorStage: "W2_AUTHORIZATION",
  disclosure: "public",
};

function syntheticW2() {
  return createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W2_AUTHORIZATION",
    receiptId: "p5-test-w2",
    sessionId: "p5-test-session",
    nonce: "p5-test-n2",
    createdAt: "2026-09-02T20:00:02Z",
    previousReceiptHash: PREV,
    payload: {
      intentReceiptHash: HASH,
      policy: { id: "github-demo-policy", version: "1" },
      policyHash: HASH,
      policyInput: {},
      policyEvaluation: [],
      policyVerdict: "ALLOW",
      approvalRequirement: { required: true },
      approvalState: "REQUIRED_APPROVED",
      authorizationVerdict: "AUTHORIZED",
      authorizedActionManifest: {},
      authorizationConstraints: [],
    },
  });
}

test("anchor payload contains exactly the minimized public field set", () => {
  const payload = buildAnchorPayload(syntheticW2(), manifest);
  assert.deepEqual(Object.keys(payload).sort(), [
    "previousReceiptHash",
    "protocol",
    "publicManifestHash",
    "receiptHash",
    "receiptId",
    "receiptKind",
    "schemaVersion",
  ]);
});

test("anchor payload canonical bytes are deterministic", () => {
  const payload = buildAnchorPayload(syntheticW2(), manifest);
  assert.equal(canonicalAnchorPayload(payload), canonicalAnchorPayload({ ...payload }));
});

test("public manifest hash is deterministic and domain separated", () => {
  const first = calculatePublicManifestHash(manifest);
  const second = calculatePublicManifestHash({ ...manifest });
  assert.match(first, /^[0-9a-f]{64}$/u);
  assert.equal(first, second);
});

test("manifest mutation changes public manifest hash", () => {
  assert.notEqual(
    calculatePublicManifestHash(manifest),
    calculatePublicManifestHash({ ...manifest, caseId: "ALLOW_BUT_DIVERGED" }),
  );
});

test("W0 is rejected by public-proof anchor builder", () => {
  const w0 = createReceipt({
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptKind: "W0_OBSERVATION",
    receiptId: "p5-test-w0",
    sessionId: "p5-test-session",
    nonce: "p5-test-n0",
    createdAt: "2026-09-02T20:00:00Z",
    previousReceiptHash: null,
    payload: {
      observationScope: {},
      evidenceManifest: [],
      repositoryState: {},
      constraints: [],
      declaredUnknowns: [],
      redactions: [],
    },
  });
  assert.throws(() => buildAnchorPayload(w0, manifest), /W2\/W3/u);
});

test("unexpected anchor fields are rejected", () => {
  const payload = buildAnchorPayload(syntheticW2(), manifest);
  assert.throws(() => parseAnchorPayload({ ...payload, rawPrompt: "forbidden" }), /exactly/u);
});

test("malformed receipt digest is rejected", () => {
  const payload = buildAnchorPayload(syntheticW2(), manifest);
  assert.throws(() => parseAnchorPayload({ ...payload, receiptHash: "not-a-hash" }), /64-hex/u);
});

test("path-like receipt identifiers are rejected from public anchor payload", () => {
  const payload = buildAnchorPayload(syntheticW2(), manifest);
  assert.throws(() => parseAnchorPayload({ ...payload, receiptId: "C:/private/path" }), /filesystem-like/u);
});
