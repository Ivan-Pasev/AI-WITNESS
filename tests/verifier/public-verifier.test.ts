import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { canonicalAnchorPayload } from "../../src/hedera/anchor.ts";
import type { PolicyDocument } from "../../src/policy/types.ts";
import type { ReceiptEnvelope } from "../../src/protocol/types.ts";
import {
  verifyLocalBundle,
  verifyPhase5NetworkEvidence,
} from "../../src/verifier/verify.ts";
import type { Phase5NetworkEvidence } from "../../src/verifier/types.ts";

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function receipts(slug: string): Promise<ReceiptEnvelope[]> {
  return Promise.all(
    ["W0", "W1", "W2", "W3"].map(async (name) =>
      json(`receipts/public/${slug}/${name}.json`) as Promise<ReceiptEnvelope>,
    ),
  );
}

async function policy(): Promise<PolicyDocument> {
  return json("policies/github-demo-policy.json") as Promise<PolicyDocument>;
}

function mirrorFetch(evidence: Phase5NetworkEvidence, mutate?: (body: Record<string, unknown>, key: string) => void): typeof fetch {
  const byKey = new Map<string, Record<string, unknown>>();
  for (const caseEvidence of evidence.cases) {
    for (const record of [caseEvidence.w2, caseEvidence.w3]) {
      const payload = {
        protocol: "IRP-1",
        schemaVersion: "1",
        receiptId: record.anchoredReceiptId,
        receiptKind: record.publicManifest.anchorStage,
        receiptHash: record.anchoredReceiptHash,
        previousReceiptHash: record.previousReceiptHash,
        publicManifestHash: record.publicManifestHash,
      };
      const key = `${record.topicId}/${record.sequenceNumber}`;
      const body: Record<string, unknown> = {
        topic_id: record.topicId,
        sequence_number: record.sequenceNumber,
        consensus_timestamp: record.consensusTimestamp,
        message: Buffer.from(canonicalAnchorPayload(payload as never), "utf8").toString("base64"),
      };
      mutate?.(body, key);
      byKey.set(key, body);
    }
  }
  return async (input) => {
    const url = new URL(String(input));
    const match = url.pathname.match(/topics\/([^/]+)\/messages\/(\d+)$/u);
    assert.ok(match);
    const body = byKey.get(`${match[1]}/${Number(match[2])}`);
    return new Response(JSON.stringify(body), {
      status: body ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };
}

async function evidence(): Promise<Phase5NetworkEvidence> {
  return json("receipts/public/hedera-testnet/index.json") as Promise<Phase5NetworkEvidence>;
}

test("V01 allow-and-match independently replays policy", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match"), policy: await policy() });
  assert.equal(report.receiptIntegrity, "INTACT");
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "ALLOW");
  assert.equal(report.approval, "REQUIRED_AND_APPROVED");
  assert.equal(report.authorization, "AUTHORIZED");
  assert.equal(report.correspondence, "MATCH");
});

test("V02 block case replays to BLOCK and remains not executed", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("block-and-not-executed"), policy: await policy() });
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "BLOCK");
  assert.equal(report.authorization, "BLOCKED");
  assert.equal(report.correspondence, "NOT_EXECUTED");
});

test("V03 divergence remains separate from chain integrity", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-but-diverged"), policy: await policy() });
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "ALLOW");
  assert.equal(report.authorization, "AUTHORIZED");
  assert.equal(report.correspondence, "DIVERGED");
  assert.ok(report.findings.some((entry) => entry.startsWith("ACTION_DIVERGENCE:")));
});

test("V04 missing public policy fails closed to POLICY_UNKNOWN", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match") });
  assert.equal(report.policy, "POLICY_UNKNOWN");
});

test("V05 mutated policy fails closed to POLICY_UNKNOWN", async () => {
  const changed = structuredClone(await policy());
  const count = changed.rules.find((entry) => entry.type === "CHANGE_COUNT");
  assert.ok(count && count.type === "CHANGE_COUNT");
  count.maxChangedFiles = 2;
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match"), policy: changed });
  assert.equal(report.policy, "POLICY_UNKNOWN");
  assert.ok(report.issues.some((entry) => entry.startsWith("POLICY_HASH_MISMATCH:")));
});

test("V06 stale receipt hash yields MODIFIED", async () => {
  const chain = await receipts("allow-and-match");
  chain[3] = { ...chain[3]!, payload: { ...chain[3]!.payload, correspondenceVerdict: "DIVERGED" } };
  const report = verifyLocalBundle({ receipts: chain, policy: await policy() });
  assert.equal(report.receiptIntegrity, "MODIFIED");
  assert.equal(report.chain, "CHAIN_BROKEN");
});

test("V07 broken parent link yields CHAIN_BROKEN", async () => {
  const chain = await receipts("allow-and-match");
  chain[3] = { ...chain[3]!, previousReceiptHash: "0".repeat(64) };
  const report = verifyLocalBundle({ receipts: chain, policy: await policy() });
  assert.equal(report.chain, "CHAIN_BROKEN");
});

test("V08 missing receipts yields explicit MISSING", () => {
  const report = verifyLocalBundle({ receipts: [] });
  assert.equal(report.receiptIntegrity, "MISSING");
  assert.equal(report.chain, "CHAIN_BROKEN");
});

test("V09 published Phase-5 evidence contains exactly six anchor records", async () => {
  const value = await evidence();
  assert.equal(value.topicId, "0.0.10345032");
  assert.equal(value.cases.length, 3);
  assert.equal(value.cases.flatMap((entry) => [entry.w2, entry.w3]).length, 6);
});

test("V10 network verifier independently rechecks all six messages", async () => {
  const value = await evidence();
  const report = await verifyPhase5NetworkEvidence(value, mirrorFetch(value));
  assert.equal(report.consensus, "ANCHORED");
  assert.ok(report.anchors.every((entry) => entry.verdict === "ANCHORED"));
});

test("V11 changed consensus timestamp prevents aggregate ANCHORED", async () => {
  const value = await evidence();
  const first = `${value.cases[0]!.w2.topicId}/${value.cases[0]!.w2.sequenceNumber}`;
  const report = await verifyPhase5NetworkEvidence(value, mirrorFetch(value, (body, key) => {
    if (key === first) body.consensus_timestamp = "1788418804.817731019";
  }));
  assert.notEqual(report.consensus, "ANCHORED");
});

test("V12 wrong topic is surfaced", async () => {
  const value = await evidence();
  const first = `${value.cases[0]!.w2.topicId}/${value.cases[0]!.w2.sequenceNumber}`;
  const report = await verifyPhase5NetworkEvidence(value, mirrorFetch(value, (body, key) => {
    if (key === first) body.topic_id = "0.0.1";
  }));
  assert.equal(report.consensus, "TOPIC_MISMATCH");
});

test("V13 wrong sequence is surfaced", async () => {
  const value = await evidence();
  const first = `${value.cases[0]!.w2.topicId}/${value.cases[0]!.w2.sequenceNumber}`;
  const report = await verifyPhase5NetworkEvidence(value, mirrorFetch(value, (body, key) => {
    if (key === first) body.sequence_number = 999;
  }));
  assert.equal(report.consensus, "SEQUENCE_MISMATCH");
});

test("V14 malformed Mirror payload fails closed", async () => {
  const value = await evidence();
  const fetchImpl: typeof fetch = async () => new Response("{", { status: 200 });
  const report = await verifyPhase5NetworkEvidence(value, fetchImpl);
  assert.equal(report.consensus, "MIRROR_ERROR");
});

test("V15 malformed evidence identity is rejected", async () => {
  const value = structuredClone(await evidence());
  value.network = "mainnet";
  await assert.rejects(() => verifyPhase5NetworkEvidence(value, mirrorFetch(value)), /identity/iu);
});

test("V16 missing one case is rejected rather than partially ANCHORED", async () => {
  const value = structuredClone(await evidence());
  value.cases.pop();
  await assert.rejects(() => verifyPhase5NetworkEvidence(value, mirrorFetch(value)), /cardinality/iu);
});

test("V17 permanent semantic-truth boundary is emitted", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match"), policy: await policy() });
  assert.equal(report.semanticTruthBoundary, "SEMANTIC TRUTH: NOT PROVEN BY IRP-1");
});
