import { readFile } from "node:fs/promises";

import type { PolicyDocument } from "../src/policy/types.ts";
import type { ReceiptEnvelope } from "../src/protocol/types.ts";
import {
  verifyLocalBundle,
  verifyPhase5NetworkEvidence,
} from "../src/verifier/verify.ts";
import type { Phase5NetworkEvidence } from "../src/verifier/types.ts";

const BOUNDARY = "SEMANTIC TRUTH: NOT PROVEN BY IRP-1";

async function loadJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

async function localCase(slug: string, policy: PolicyDocument): Promise<void> {
  const base = `receipts/public/${slug}`;
  const receipts = await Promise.all(
    ["W0", "W1", "W2", "W3"].map(async (name) =>
      loadJson(`${base}/${name}.json`) as Promise<ReceiptEnvelope>,
    ),
  );
  console.log(JSON.stringify({ slug, ...verifyLocalBundle({ receipts, policy }) }, null, 2));
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? "all";
  if (mode === "network" || mode === "all") {
    const evidence = (await loadJson(
      "receipts/public/hedera-testnet/index.json",
    )) as Phase5NetworkEvidence;
    const report = await verifyPhase5NetworkEvidence(evidence);
    if (report.consensus !== "ANCHORED") {
      throw new Error(`Live public consensus verification failed closed: ${report.consensus}`);
    }
    console.log(JSON.stringify({ source: "hedera-testnet", ...report }, null, 2));
  }

  if (mode === "local" || mode === "all") {
    const policy = (await loadJson("policies/github-demo-policy.json")) as PolicyDocument;
    for (const slug of [
      "allow-and-match",
      "block-and-not-executed",
      "allow-but-diverged",
    ]) {
      await localCase(slug, policy);
    }
  }

  console.log(BOUNDARY);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Verifier failed.");
  process.exitCode = 1;
});
