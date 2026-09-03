import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { canonicalAnchorPayload } from "../../src/hedera/anchor.ts";
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

test("V01 allow-and-match yields independent multidimensional local verdict", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match") });
  assert.equal(report.receiptIntegrity, "INTACT");
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "ALLOW");
  assert.equal(report.approval, "REQUIRED_AND_APPROVED");
  assert.equal(report.authorization, "AUTHORIZED");
  assert.equal(report.correspondence, "MATCH");
  assert.equal(report.consensus, "NOT_CHECKED");
});

test("V02 block case remains chain-valid and not executed", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("block-and-not-executed") });
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "BLOCK");
  assert.equal(report.authorization, "BLOCKED");
  assert.equal(report.correspondence, "NOT_EXECUTED");
});

test("V03 divergence is surfaced without collapsing chain integrity", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-but-diverged") });
  assert.equal(report.chain, "CHAIN_VALID");
  assert.equal(report.policy, "ALLOW");
  assert.equal(report.authorization, "AUTHORIZED");
  assert.equal(report.correspondence, "DIVERGED");
  assert.ok(report.findings.some((entry) => entry.startsWith("ACTION_DIVERGENCE:")));
});

test("V04 stale receipt hash yields MODIFIED", async () => {
  const chain = await receipts("allow-and-match");
  chain[3] = {
    ...chain[3]!,
    payload: { ...chain[3]!.payload, correspondenceVerdict: "DIVERGED" },
  };
  const report = verifyLocalBundle({ receipts: chain });
  assert.equal(report.receiptIntegrity, "MODIFIED");
  assert.equal(report.chain, "CHAIN_BROKEN");
});

test("V05 missing receipts yields explicit MISSING", () => {
  const report = verifyLocalBundle({ receipts: [] });
  assert.equal(report.receiptIntegrity, "MISSING");
  assert.equal(report.chain, "CHAIN_BROKEN");
});

test("V06 published Phase-5 evidence contains six anchor records", async () => {
  const evidence = (await json(
    "receipts/public/hedera-testnet/index.json",
  )) as Phase5NetworkEvidence;
  assert.equal(evidence.topicId, "0.0.10345032");
  assert.equal(evidence.cases.length, 3);
  assert.equal(evidence.cases.flatMap((entry) => [entry.w2, entry.w3]).length, 6);
});

test("V07 network verifier independently rechecks all six mirror messages", async () => {
  const evidence = (await json(
    "receipts/public/hedera-testnet/index.json",
  )) as Phase5NetworkEvidence;
  const byKey = new Map<string, unknown>();
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
      byKey.set(`${record.topicId}/${record.sequenceNumber}`, {
        topic_id: record.topicId,
        sequence_number: record.sequenceNumber,
        consensus_timestamp: record.consensusTimestamp,
        message: Buffer.from(canonicalAnchorPayload(payload as never), "utf8").toString("base64"),
      });
    }
  }
  const fetchImpl: typeof fetch = async (input) => {
    const url = new URL(String(input));
    const match = url.pathname.match(/topics\/([^/]+)\/messages\/(\d+)$/u);
    assert.ok(match);
    const body = byKey.get(`${match[1]}/${Number(match[2])}`);
    return new Response(JSON.stringify(body), {
      status: body ? 200 : 404,
      headers: { "content-type": "application/json" },
    });
  };
  const report = await verifyPhase5NetworkEvidence(evidence, fetchImpl);
  assert.equal(report.consensus, "ANCHORED");
  assert.equal(report.anchors.length, 6);
  assert.ok(report.anchors.every((entry) => entry.verdict === "ANCHORED"));
});

test("V08 one consensus timestamp mismatch prevents aggregate ANCHORED", async () => {
  const evidence = structuredClone(
    (await json("receipts/public/hedera-testnet/index.json")) as Phase5NetworkEvidence,
  );
  const first = evidence.cases[0]!.w2;
  const payload = {
    protocol: "IRP-1",
    schemaVersion: "1",
    receiptId: first.anchoredReceiptId,
    receiptKind: first.publicManifest.anchorStage,
    receiptHash: first.anchoredReceiptHash,
    previousReceiptHash: first.previousReceiptHash,
    publicManifestHash: first.publicManifestHash,
  };
  const fetchImpl: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        topic_id: first.topicId,
        sequence_number: first.sequenceNumber,
        consensus_timestamp: "1788418804.817731019",
        message: Buffer.from(canonicalAnchorPayload(payload as never), "utf8").toString("base64"),
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  const oneCase = { ...evidence, cases: [evidence.cases[0]!] };
  const report = await verifyPhase5NetworkEvidence(oneCase, fetchImpl);
  assert.notEqual(report.consensus, "ANCHORED");
});

test("V09 permanent semantic-truth boundary is emitted", async () => {
  const report = verifyLocalBundle({ receipts: await receipts("allow-and-match") });
  assert.equal(report.semanticTruthBoundary, "SEMANTIC TRUTH: NOT PROVEN BY IRP-1");
});
