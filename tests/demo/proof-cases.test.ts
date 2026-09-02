import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { evaluatePolicy } from "../../src/policy/evaluate.ts";
import { calculatePolicyHash } from "../../src/policy/load-policy.ts";
import type { PolicyEvaluation } from "../../src/policy/types.ts";
import { validateCompleteChain } from "../../src/protocol/chain.ts";
import { validateReceiptIntegrity } from "../../src/protocol/validate.ts";
import type { JsonObject, ReceiptEnvelope } from "../../src/protocol/types.ts";
import { BASE_STATE, DEMO_POLICY } from "../../demo/cases/build-case.ts";
import { buildPublicBundle } from "../../demo/cases/public-bundle.ts";
import { runDemoCase } from "../../demo/cases/run-case.ts";
import { stateHash } from "../../demo/cases/compare-action.ts";

const SLUGS = ["allow-and-match", "block-and-not-executed", "allow-but-diverged"] as const;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
}
function bundleReceipt(slug: string, index: number): ReceiptEnvelope {
  return readJson<ReceiptEnvelope>(`receipts/public/${slug}/W${index}.json`);
}
function bundlePolicy(slug: string): PolicyEvaluation {
  return readJson<PolicyEvaluation>(`receipts/public/${slug}/policy-evaluation.json`);
}
function expectedVerdict(slug: string): JsonObject {
  return readJson<JsonObject>(`receipts/public/${slug}/expected-verdict.json`);
}
function receiptSet(slug: string): [ReceiptEnvelope, ReceiptEnvelope, ReceiptEnvelope, ReceiptEnvelope] {
  return [bundleReceipt(slug,0), bundleReceipt(slug,1), bundleReceipt(slug,2), bundleReceipt(slug,3)];
}

// Case A
test("A01 public bundle files exist", () => {
  for (const name of ["W0.json","W1.json","W2.json","W3.json","policy-evaluation.json","manifest.json","expected-verdict.json","REPRODUCE.md"]) assert.equal(existsSync(resolve(process.cwd(), `receipts/public/allow-and-match/${name}`)), true);
});
test("A02 all receipt hashes validate", () => { for (const r of receiptSet("allow-and-match")) assert.equal(validateReceiptIntegrity(r).ok,true); });
test("A03 complete chain validates", () => { const r=validateCompleteChain(receiptSet("allow-and-match")); assert.equal(r.ok,true); assert.equal(r.findings.length,0); });
test("A04 policy reruns to ALLOW", () => { const r=runDemoCase("allow-and-match"); assert.equal(r.policyEvaluation.verdict,"ALLOW"); assert.deepEqual(bundlePolicy("allow-and-match"),r.policyEvaluation); });
test("A05 approval state is REQUIRED_APPROVED", () => assert.equal(bundleReceipt("allow-and-match",2).payload.approvalState,"REQUIRED_APPROVED"));
test("A06 W2 is AUTHORIZED", () => assert.equal(bundleReceipt("allow-and-match",2).payload.authorizationVerdict,"AUTHORIZED"));
test("A07 actual file set equals authorized file set", () => { const w2=bundleReceipt("allow-and-match",2),w3=bundleReceipt("allow-and-match",3); assert.deepEqual(w3.payload.actualActionManifest,w2.payload.authorizedActionManifest); });
test("A08 actual change count equals authorized count", () => { const w2=bundleReceipt("allow-and-match",2),w3=bundleReceipt("allow-and-match",3); assert.equal((w3.payload.actualActionManifest as JsonObject).changeCount,(w2.payload.authorizedActionManifest as JsonObject).changeCount); });
test("A09 actual change digest equals authorized digest", () => { const w2=bundleReceipt("allow-and-match",2),w3=bundleReceipt("allow-and-match",3); assert.equal((w3.payload.actualActionManifest as JsonObject).changeDigest,(w2.payload.authorizedActionManifest as JsonObject).changeDigest); });
test("A10 W3 correspondence is MATCH", () => assert.equal(bundleReceipt("allow-and-match",3).payload.correspondenceVerdict,"MATCH"));

// Case B
test("B11 public bundle files exist", () => { for (const name of ["W0.json","W1.json","W2.json","W3.json","policy-evaluation.json","manifest.json","expected-verdict.json","REPRODUCE.md"]) assert.equal(existsSync(resolve(process.cwd(), `receipts/public/block-and-not-executed/${name}`)), true); });
test("B12 hashes and chain validate", () => { const rs=receiptSet("block-and-not-executed"); for(const r of rs) assert.equal(validateReceiptIntegrity(r).ok,true); assert.equal(validateCompleteChain(rs).ok,true); });
test("B13 at least one deterministic rule is FAIL", () => assert.equal(bundlePolicy("block-and-not-executed").ruleResults.some(e=>e.result==="FAIL"),true));
test("B14 policy aggregate is BLOCK", () => assert.equal(bundlePolicy("block-and-not-executed").verdict,"BLOCK"));
test("B15 W2 authorization is BLOCKED", () => assert.equal(bundleReceipt("block-and-not-executed",2).payload.authorizationVerdict,"BLOCKED"));
test("B16 executor produces zero mutations", () => { const r=runDemoCase("block-and-not-executed"); assert.deepEqual(r.afterState,r.beforeState); assert.equal(r.actualActionManifest.changeCount as number,0); });
test("B17 before and after fixture digest is identical", () => { const r=runDemoCase("block-and-not-executed"); assert.equal(stateHash(r.beforeState),stateHash(r.afterState)); });
test("B18 W3 execution is NOT_EXECUTED", () => assert.equal(bundleReceipt("block-and-not-executed",3).payload.executionState,"NOT_EXECUTED"));
test("B19 W3 correspondence is NOT_EXECUTED", () => assert.equal(bundleReceipt("block-and-not-executed",3).payload.correspondenceVerdict,"NOT_EXECUTED"));
test("B20 synthetic marker is obvious and no real private key header exists", () => { const p=readFileSync(resolve(process.cwd(),"demo/proposals/block-and-not-executed.json"),"utf8"); assert.match(p,/SYNTHETIC_PRIVATE_KEY/u); assert.doesNotMatch(p,/-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/u); });

// Case C
test("C21 public bundle files exist", () => { for (const name of ["W0.json","W1.json","W2.json","W3.json","policy-evaluation.json","manifest.json","expected-verdict.json","REPRODUCE.md"]) assert.equal(existsSync(resolve(process.cwd(), `receipts/public/allow-but-diverged/${name}`)), true); });
test("C22 hashes and chain validate", () => { const rs=receiptSet("allow-but-diverged"); for(const r of rs) assert.equal(validateReceiptIntegrity(r).ok,true); assert.equal(validateCompleteChain(rs).ok,true); });
test("C23 policy reruns to ALLOW", () => { const r=runDemoCase("allow-but-diverged"); assert.equal(r.policyEvaluation.verdict,"ALLOW"); assert.deepEqual(bundlePolicy("allow-but-diverged"),r.policyEvaluation); });
test("C24 W2 authorization is AUTHORIZED", () => assert.equal(bundleReceipt("allow-but-diverged",2).payload.authorizationVerdict,"AUTHORIZED"));
test("C25 executor performs authorized target change", () => { const r=runDemoCase("allow-but-diverged"); assert.notEqual(r.beforeState.files["demo/target.md"],r.afterState.files["demo/target.md"]); });
test("C26 executor performs one controlled extra synthetic change", () => { const r=runDemoCase("allow-but-diverged"); assert.notEqual(r.beforeState.files["demo/adversarial-extra.md"],r.afterState.files["demo/adversarial-extra.md"]); });
test("C27 actual path set exceeds authorized path set", () => { const w2=bundleReceipt("allow-but-diverged",2),w3=bundleReceipt("allow-but-diverged",3); const a=(w2.payload.authorizedActionManifest as JsonObject).targetPaths as string[],b=(w3.payload.actualActionManifest as JsonObject).targetPaths as string[]; assert.equal(a.length,1); assert.equal(b.length,2); assert.equal(b.includes("demo/adversarial-extra.md"),true); });
test("C28 W2 remains intact", () => assert.equal(validateReceiptIntegrity(bundleReceipt("allow-but-diverged",2)).ok,true));
test("C29 W3 execution is EXECUTED", () => assert.equal(bundleReceipt("allow-but-diverged",3).payload.executionState,"EXECUTED"));
test("C30 W3 correspondence is DIVERGED", () => assert.equal(bundleReceipt("allow-but-diverged",3).payload.correspondenceVerdict,"DIVERGED"));
test("C31 violation identifies unauthorized extra mutation", () => { const v=bundleReceipt("allow-but-diverged",3).payload.violations as JsonObject[]; assert.deepEqual(v,[{code:"UNAUTHORIZED_EXTRA_PATH",path:"demo/adversarial-extra.md"}]); });
test("C32 chain remains CHAIN_VALID despite DIVERGED correspondence", () => { const c=validateCompleteChain(receiptSet("allow-but-diverged")); assert.equal(c.ok,true); assert.equal(c.findings.some(e=>e.category==="ACTION_DIVERGENCE"),true); });

// Cross-case
test("X33 all three case IDs are unique", () => assert.equal(new Set(SLUGS.map(s=>runDemoCase(s).definition.id)).size,3));
test("X34 receipt IDs and nonces are unique within each replay domain", () => { for(const s of SLUGS){const r=receiptSet(s); assert.equal(new Set(r.map(x=>x.receiptId)).size,4); assert.equal(new Set(r.map(x=>x.nonce)).size,4);} });
test("X35 public bundle regeneration is deterministic", () => { for(const s of SLUGS){const g=buildPublicBundle(runDemoCase(s)); assert.deepEqual(g.receipts,receiptSet(s)); assert.deepEqual(g.policyEvaluation,bundlePolicy(s)); assert.deepEqual(g.manifest,readJson<JsonObject>(`receipts/public/${s}/manifest.json`)); assert.deepEqual(g.expectedVerdict,expectedVerdict(s));} });
test("X36 every public receipt recomputes to its committed hash", () => { for(const s of SLUGS) for(const r of receiptSet(s)) assert.equal(validateReceiptIntegrity(r).ok,true); });
test("X37 all public policy hashes recompute", () => { const e=calculatePolicyHash(DEMO_POLICY); for(const s of SLUGS) assert.equal(bundlePolicy(s).policyHash,e); });
test("X38 no public case claims Hedera anchoring", () => { for(const s of SLUGS){assert.equal(expectedVerdict(s).hederaEvidence,"NONE"); const t=readFileSync(resolve(process.cwd(),`receipts/public/${s}/manifest.json`),"utf8"); assert.doesNotMatch(t,/topicId|sequenceNumber|consensusTimestamp|transactionId/u);} });
test("X39 no public case contains private local absolute paths", () => { for(const s of SLUGS){const root=resolve(process.cwd(),`receipts/public/${s}`); const names=["W0.json","W1.json","W2.json","W3.json","policy-evaluation.json","manifest.json","expected-verdict.json","REPRODUCE.md"]; const t=names.map(n=>readFileSync(resolve(root,n),"utf8")).join("\n"); assert.doesNotMatch(t,/[A-Za-z]:\\|\/home\/|\/Users\//u);} });
test("X40 receipts/private has no tracked checkout content", () => assert.equal(existsSync(resolve(process.cwd(),"receipts/private")),false));
test("X41 policy fixture hash equals the canonical policy hash", () => assert.equal(calculatePolicyHash(DEMO_POLICY),bundlePolicy("allow-and-match").policyHash));
test("X42 all complete chains share stable session identity per case", () => { for(const s of SLUGS) assert.equal(new Set(receiptSet(s).map(r=>r.sessionId)).size,1); });
test("X43 all static expected verdicts match runtime verdicts", () => { for(const s of SLUGS) assert.deepEqual(expectedVerdict(s),runDemoCase(s).verdict); });
test("X44 all public manifests identify IRP-1 schemaVersion 1", () => { for(const s of SLUGS){const m=readJson<JsonObject>(`receipts/public/${s}/manifest.json`); assert.equal(m.protocol,"IRP-1"); assert.equal(m.schemaVersion,"1");} });
test("X45 deterministic baseline fixture hash is stable across runs", () => { assert.equal(stateHash(BASE_STATE),stateHash(BASE_STATE)); assert.match(stateHash(BASE_STATE),/^[0-9a-f]{64}$/u); });
test("X46 all W2 policy inputs are replayable public objects", () => { for(const s of SLUGS){const i=bundleReceipt(s,2).payload.policyInput as JsonObject; const e=evaluatePolicy(DEMO_POLICY,{targetPaths:i.targetPaths as string[],changedFileCount:i.changedFileCount as number,proposalText:i.proposalText as string,approvalState:i.approvalState as "REQUIRED_APPROVED"}); assert.equal(e.verdict,bundlePolicy(s).verdict); assert.equal(e.policyHash,bundlePolicy(s).policyHash);} });
test("X47 Case B protected fixture remains baseline in runtime state", () => {const r=runDemoCase("block-and-not-executed"); assert.equal(r.afterState.files["demo/protected/immutable.txt"],BASE_STATE.files["demo/protected/immutable.txt"]);});
test("X48 Case C does not retroactively add extra path to W2 authorization", () => {const w2=bundleReceipt("allow-but-diverged",2); assert.deepEqual((w2.payload.authorizedActionManifest as JsonObject).targetPaths,["demo/target.md"]);});
test("X49 public bundles contain permanent semantic-truth boundary in reproduction docs", () => {for(const s of SLUGS) assert.match(readFileSync(resolve(process.cwd(),`receipts/public/${s}/REPRODUCE.md`),"utf8"),/SEMANTIC TRUTH: NOT PROVEN BY IRP-1/u);});
test("X50 fixture timestamps are explicitly synthetic and never called consensus timestamps", () => {for(const s of SLUGS){const t=readFileSync(resolve(process.cwd(),`receipts/public/${s}/REPRODUCE.md`),"utf8"); assert.match(t,/synthetic deterministic values/u); assert.match(t,/not Hedera consensus timestamps/u);}});
