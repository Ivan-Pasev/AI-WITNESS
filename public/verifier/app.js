const $ = (id) => document.getElementById(id);
const boundary = "SEMANTIC TRUTH: NOT PROVEN BY IRP-1";

function card(label, value) {
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<strong>${label}</strong><br>${String(value)}`;
  return el;
}

function show(report) {
  $("verdicts").replaceChildren();
  const fields = ["receiptIntegrity","chain","consensus","policy","approval","authorization","correspondence"];
  for (const field of fields) if (field in report) $("verdicts").append(card(field, report[field]));
  $("details").textContent = JSON.stringify(report, null, 2);
}

function inspectLocal(value) {
  const receipts = Array.isArray(value?.receipts) ? value.receipts : [];
  if (receipts.length === 0) return {receiptIntegrity:"MISSING",chain:"CHAIN_BROKEN",consensus:"NOT_CHECKED",policy:"POLICY_UNKNOWN",approval:"UNKNOWN",authorization:"UNKNOWN",correspondence:"UNKNOWN",semanticTruthBoundary:boundary};
  const byKind = Object.fromEntries(receipts.map((r) => [r.receiptKind, r]));
  const w2 = byKind.W2_AUTHORIZATION;
  const w3 = byKind.W3_OUTCOME;
  const order = ["W0_OBSERVATION","W1_INTENT","W2_AUTHORIZATION","W3_OUTCOME"];
  const chain = receipts.length === 4 && order.every((k,i)=>receipts[i]?.receiptKind===k) &&
    receipts[1]?.previousReceiptHash===receipts[0]?.receiptHash &&
    receipts[2]?.previousReceiptHash===receipts[1]?.receiptHash &&
    receipts[3]?.previousReceiptHash===receipts[2]?.receiptHash ? "CHAIN_VALID":"CHAIN_BROKEN";
  return {
    receiptIntegrity:"NOT_CRYPTOGRAPHICALLY_CHECKED_IN_BROWSER_SURFACE",
    chain, consensus:"NOT_CHECKED",
    policy:w2?.payload?.policyVerdict ?? "POLICY_UNKNOWN",
    approval:w2?.payload?.approvalState ?? "UNKNOWN",
    authorization:w2?.payload?.authorizationVerdict ?? "UNKNOWN",
    correspondence:w3?.payload?.correspondenceVerdict ?? "UNKNOWN",
    semanticTruthBoundary:boundary,
    note:"The repository TypeScript verifier performs cryptographic receipt and Mirror checks. This static browser surface intentionally labels receipt hashing as not checked rather than pretending equivalence."
  };
}

async function inspect(value) {
  if (value?.profile === "IRP-1-HEDERA-TESTNET-P5-A-v1" && Array.isArray(value.cases)) {
    const anchors = value.cases.flatMap((c)=>[c.w2,c.w3]);
    return {
      consensus: anchors.every((a)=>a.verificationVerdict==="ANCHORED") ? "RECORDED_ANCHORED_REVERIFY_WITH_CLI" : "RECORDED_NON_ANCHORED",
      topicId:value.topicId,
      anchorCount:anchors.length,
      semanticTruthBoundary:boundary,
      note:"Use `npm run verify:public -- network` for independent live Mirror Node re-verification."
    };
  }
  return inspectLocal(value);
}

$("verify").onclick = async () => {
  try { show(await inspect(JSON.parse($("input").value))); }
  catch (error) { show({error:String(error),semanticTruthBoundary:boundary}); }
};
$("file").onchange = async (event) => {
  const file = event.target.files?.[0]; if (!file) return;
  $("input").value = await file.text(); $("verify").click();
};
$("loadNetwork").onclick = async () => {
  const response = await fetch("../../receipts/public/hedera-testnet/index.json");
  $("input").value = await response.text(); $("verify").click();
};
