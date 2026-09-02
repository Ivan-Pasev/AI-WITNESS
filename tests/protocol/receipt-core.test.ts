import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize } from "../../src/protocol/canonicalize.ts";
import { createReceipt } from "../../src/protocol/create-receipt.ts";
import { calculateReceiptHash, DOMAIN_SEPARATORS } from "../../src/protocol/hash.ts";
import { validateCompleteChain, validateReceiptSet } from "../../src/protocol/chain.ts";
import { NonceRegistry } from "../../src/protocol/nonce-registry.ts";
import { selectPublicFields } from "../../src/protocol/redact.ts";
import { PROTOCOL, SCHEMA_VERSION, type JsonObject, type ReceiptEnvelope } from "../../src/protocol/types.ts";
import { validateReceiptIntegrity, validateReceiptSchema } from "../../src/protocol/validate.ts";

const H = "a".repeat(64);
const w0p = (): JsonObject => ({observationScope:{repository:"demo"},evidenceManifest:[],repositoryState:{head:"abc"},constraints:[],declaredUnknowns:[],redactions:[]});
const w1p = (): JsonObject => ({interpretation:{summary:"bounded"},assumptions:[],uncertainty:{known:[],uncertain:[],unknown:[],limitations:[]},intendedAction:{op:"append"},actionManifest:{targetPaths:["demo/target.md"],expectedChangeCount:1},expectedEffect:{changed:true},policyRef:{id:"demo",version:"1"},approvalExpectation:{required:true}});
const w2p = (h:string,o:JsonObject={}):JsonObject => ({intentReceiptHash:h,policy:{id:"demo",version:"1"},policyHash:H,policyInput:{targetPaths:["demo/target.md"]},policyEvaluation:[{id:"path",result:"PASS"}],policyVerdict:"ALLOW",approvalRequirement:{required:true},approvalState:"REQUIRED_APPROVED",authorizationVerdict:"AUTHORIZED",authorizedActionManifest:{targetPaths:["demo/target.md"],expectedChangeCount:1},authorizationConstraints:[],...o});
const w3p = (h:string,o:JsonObject={}):JsonObject => ({authorizationReceiptHash:h,executionState:"EXECUTED",actualActionManifest:{targetPaths:["demo/target.md"],actualChangeCount:1},observedResult:{changed:true},correspondenceVerdict:"MATCH",violations:[],residualUnknowns:[],...o});

function chain(): ReceiptEnvelope[] {
  const w0=createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W0_OBSERVATION",receiptId:"r0",sessionId:"s1",nonce:"n0",createdAt:"2026-09-02T15:00:00Z",previousReceiptHash:null,payload:w0p()});
  const w1=createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W1_INTENT",receiptId:"r1",sessionId:"s1",nonce:"n1",createdAt:"2026-09-02T15:00:01Z",previousReceiptHash:w0.receiptHash,payload:w1p()});
  const w2=createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W2_AUTHORIZATION",receiptId:"r2",sessionId:"s1",nonce:"n2",createdAt:"2026-09-02T15:00:02Z",previousReceiptHash:w1.receiptHash,payload:w2p(w1.receiptHash)});
  const w3=createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W3_OUTCOME",receiptId:"r3",sessionId:"s1",nonce:"n3",createdAt:"2026-09-02T15:00:03Z",previousReceiptHash:w2.receiptHash,payload:w3p(w2.receiptHash)});
  return [w0,w1,w2,w3];
}
function resign(r:ReceiptEnvelope,c:Partial<ReceiptEnvelope>):ReceiptEnvelope { const n={...r,...c,payload:(c.payload??r.payload) as JsonObject} as ReceiptEnvelope; return {...n,receiptHash:calculateReceiptHash(n)}; }
function w3for(c:ReceiptEnvelope[],w2:ReceiptEnvelope,o:JsonObject={}):ReceiptEnvelope { const old=c[3]!; return createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W3_OUTCOME",receiptId:old.receiptId,sessionId:old.sessionId,nonce:old.nonce,createdAt:old.createdAt,previousReceiptHash:w2.receiptHash,payload:w3p(w2.receiptHash,o)}); }
const has=(r:{issues:{category:string}[]},c:string)=>r.issues.some(x=>x.category===c);

test("1 reordered properties canonicalize and hash identically",()=>{assert.equal(canonicalize({z:1,a:{y:2,x:3}}),canonicalize({a:{x:3,y:2},z:1})); const [w0]=chain(); assert.equal(calculateReceiptHash(w0!),calculateReceiptHash({...w0!,receiptHash:"f".repeat(64)}));});
test("2 accepted mutation changes digest",()=>{const [w0]=chain(); assert.notEqual(calculateReceiptHash(w0!),calculateReceiptHash({...w0!,payload:{...w0!.payload,constraints:["changed"]}}));});
test("3 receipt kind domain separation changes digest",()=>{const [w0]=chain(); assert.notEqual(DOMAIN_SEPARATORS.W0_OBSERVATION,DOMAIN_SEPARATORS.W1_INTENT); assert.notEqual(calculateReceiptHash(w0!),calculateReceiptHash({...w0!,receiptKind:"W1_INTENT",previousReceiptHash:H,payload:w1p()} as ReceiptEnvelope));});
test("4 receiptHash excluded from self-hash",()=>{const [w0]=chain(); assert.equal(calculateReceiptHash(w0!),calculateReceiptHash({...w0!,receiptHash:"b".repeat(64)}));});
test("5 RFC8785/JCS compatibility vector",()=>{const v={numbers:[333333333.33333329,1e30,4.5,2e-3,1e-27],string:"€$\u000f\nA'B\"\\\\\"/",literals:[null,true,false]}; assert.equal(canonicalize(v),"{\"literals\":[null,true,false],\"numbers\":[333333333.3333333,1e+30,4.5,0.002,1e-27],\"string\":\"€$\\u000f\\nA'B\\\"\\\\\\\\\\\"/\"}");});
for (const [n,v] of [["6 undefined",{a:undefined}],["7 NaN",{a:Number.NaN}],["8 Infinity",{a:Number.POSITIVE_INFINITY}],["9 function",{a:()=>1}]] as const) test(`${n} rejected`,()=>assert.throws(()=>canonicalize(v)));
test("10 cyclic object rejected",()=>{const x:Record<string,unknown>={};x.self=x;assert.throws(()=>canonicalize(x));});
test("11 Date class and binary rejected",()=>{class E{x=1}; for(const v of [new Date(),new E(),new Uint8Array([1])]) assert.throws(()=>canonicalize({a:v}));});
test("12 valid complete chain passes",()=>assert.equal(validateCompleteChain(chain()).ok,true));
test("13 wrong previous hash",()=>{const c=chain(),w2=resign(c[2]!,{previousReceiptHash:"b".repeat(64)}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"PARENT_HASH_MISMATCH"));});
test("14 wrong W2 semantic parent",()=>{const c=chain(),w2=resign(c[2]!,{payload:w2p("b".repeat(64))}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"SEMANTIC_PARENT_MISMATCH"));});
test("15 wrong W3 semantic parent",()=>{const c=chain(),w3=resign(c[3]!,{payload:w3p("b".repeat(64))});assert.ok(has(validateCompleteChain([c[0]!,c[1]!,c[2]!,w3]),"SEMANTIC_PARENT_MISMATCH"));});
test("16 duplicate nonce",()=>{const c=chain(),w2=resign(c[2]!,{nonce:c[1]!.nonce}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"DUPLICATE_NONCE"));});
test("17 duplicate receiptId",()=>{const c=chain(),w2=resign(c[2]!,{receiptId:c[1]!.receiptId}),w3=w3for(c,w2);assert.equal(validateCompleteChain([c[0]!,c[1]!,w2,w3]).ok,false);});
test("18 missing stage",()=>{const c=chain();assert.ok(has(validateCompleteChain([c[0]!,c[1]!,c[3]!]),"MISSING_STAGE"));});
test("19 bad stage order",()=>{const c=chain();assert.ok(has(validateCompleteChain([c[0]!,c[2]!,c[1]!,c[3]!]),"INVALID_STAGE_ORDER"));});
test("20 invalid protocol schema",()=>{const [w0]=chain();assert.equal(validateReceiptSchema({...w0!,protocol:"IRP-X"}).ok,false);});
test("21 session mismatch",()=>{const c=chain(),w2=resign(c[2]!,{sessionId:"other"}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"SESSION_MISMATCH"));});
test("22 child timestamp predates parent",()=>{const c=chain(),w2=resign(c[2]!,{createdAt:"2026-09-02T14:59:59Z"}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"TIME_ORDER_VIOLATION"));});
test("23 stale hash detects mutation",()=>{const [w0]=chain();assert.ok(has(validateReceiptIntegrity({...w0!,payload:{...w0!.payload,constraints:["mutated"]}}),"HASH_MISMATCH"));});
test("24 fork detected",()=>{const c=chain(),f=createReceipt({protocol:PROTOCOL,schemaVersion:SCHEMA_VERSION,receiptKind:"W1_INTENT",receiptId:"r1f",sessionId:"s1",nonce:"n1f",createdAt:c[1]!.createdAt,previousReceiptHash:c[0]!.receiptHash,payload:{...w1p(),intendedAction:{op:"different"}}});assert.ok(has(validateReceiptSet([...c,f]),"FORK_DETECTED"));});
test("25 BLOCK plus AUTHORIZED rejected",()=>{const c=chain(),w2=resign(c[2]!,{payload:w2p(c[1]!.receiptHash,{policyVerdict:"BLOCK",authorizationVerdict:"AUTHORIZED"})});assert.ok(has(validateReceiptSchema(w2),"POLICY_BLOCK"));});
test("26 blocked then executed unauthorized",()=>{const c=chain(),w2=resign(c[2]!,{payload:w2p(c[1]!.receiptHash,{policyEvaluation:[{id:"path",result:"FAIL"}],policyVerdict:"BLOCK",approvalRequirement:{required:false},approvalState:"NOT_REQUIRED",authorizationVerdict:"BLOCKED"})}),w3=w3for(c,w2);assert.ok(has(validateCompleteChain([c[0]!,c[1]!,w2,w3]),"UNAUTHORIZED_EXECUTION"));});
test("27 required approval missing cannot authorize",()=>{const c=chain(),w2=resign(c[2]!,{payload:w2p(c[1]!.receiptHash,{approvalRequirement:{required:true},approvalState:"REQUIRED_PENDING",authorizationVerdict:"AUTHORIZED"})});assert.ok(has(validateReceiptSchema(w2),"APPROVAL_REQUIRED"));});
test("28 ESCALATE plus AUTHORIZED rejected",()=>{const c=chain(),w2=resign(c[2]!,{payload:w2p(c[1]!.receiptHash,{policyEvaluation:[{id:"path",result:"UNKNOWN"}],policyVerdict:"ESCALATE",authorizationVerdict:"AUTHORIZED"})});assert.ok(has(validateReceiptSchema(w2),"POLICY_ESCALATE"));});
test("29 DIVERGED preserves chain integrity and surfaces finding",()=>{const c=chain(),w3=resign(c[3]!,{payload:w3p(c[2]!.receiptHash,{actualActionManifest:{targetPaths:["demo/target.md","demo/extra.md"],actualChangeCount:2},correspondenceVerdict:"DIVERGED",violations:["extra path"]})}),r=validateCompleteChain([c[0]!,c[1]!,c[2]!,w3]);assert.equal(r.ok,true);assert.ok(r.findings.some(x=>x.category==="ACTION_DIVERGENCE"));});
test("30 replay registry rejects duplicate nonce and receipt id",()=>{const [w0]=chain(),r=new NonceRegistry();assert.equal(r.register(w0!).ok,true);assert.equal(r.register({...w0!,receiptId:"other"}).ok,false);r.clear();assert.equal(r.register(w0!).ok,true);assert.equal(r.register({...w0!,nonce:"other"}).ok,false);});
test("31 disclosure helper requires explicit allow-list",()=>{assert.deepEqual(selectPublicFields({protocol:"IRP-1",privateField:"private-marker"},["protocol"]),{protocol:"IRP-1"});assert.throws(()=>selectPublicFields({protocol:"IRP-1"},[]));});
test("32 domain separators frozen exactly",()=>assert.deepEqual(DOMAIN_SEPARATORS,{W0_OBSERVATION:"IRP1:OBSERVATION",W1_INTENT:"IRP1:INTENT",W2_AUTHORIZATION:"IRP1:AUTHORIZATION",W3_OUTCOME:"IRP1:OUTCOME"}));
