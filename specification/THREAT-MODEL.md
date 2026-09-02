# IRP-1 Threat Model

**Protocol:** IRP-1  
**Schema version:** 1  
**Status:** SPECIFIED  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 1. Scope

This threat model defines the adversaries IRP-1 is expected to surface or constrain in the bounded public-proof profile. It does not claim complete system security.

The protocol’s principal security objective is narrower: make specified forms of silent rewriting, replay, authorization failure, evidence substitution, and execution divergence detectable relative to committed evidence.

## 2. Trust boundaries

IRP-1 separates at least these trust boundaries:

- observation source / host;
- AI interpretation layer;
- deterministic policy engine;
- human approval mechanism;
- authorization receipt construction;
- executor;
- receipt storage/publication;
- Hedera submission path;
- Mirror Node retrieval path;
- verifier implementation;
- operator behavior.

A control at one boundary MUST NOT be represented as solving every other boundary.

## 3. Adversary register

| ID | Adversary | Capability / objective | IRP-1 defense | Residual risk / not solved |
|---|---|---|---|---|
| A1 | Receipt mutator | Alter a committed receipt after creation | RFC 8785/JCS canonicalization + SHA-256 digest + parent-link validation | Does not prove original content was truthful |
| A2 | Chain rewriter | Replace parent/child relations or reorder stages | Exact W0→W1→W2→W3 ordering, previous-receipt hashes, semantic parent references, session continuity | A fully compromised pre-commit host can construct a false but internally consistent chain |
| A3 | Replay attacker | Reuse an old receipt or authorization for a new execution | Nonce uniqueness, receipt/session binding, replay-domain checks, W2 intent binding | External systems must actually enforce replay checks at execution boundaries |
| A4 | Authorization bypasser | Execute despite BLOCK, unresolved policy, or missing approval | W2 authorization contract; W3 preserves observed execution; verifier reports unauthorized execution | IRP-1 may detect evidence of bypass but cannot physically prevent every executor |
| A5 | Policy substitution | Replace policy, version, inputs, or verdict after intent | Policy identifier/version/hash/input committed in W2; deterministic replay when policy material is public | Private/non-reproducible policy material limits independent replay |
| A6 | Approval forger | Claim human approval that did not occur | Explicit approval state and pre-execution ordering; optional future signature layer | Plain-text approver references do not prove real-world identity |
| A7 | Divergent executor | Execute more, less, or differently than W2 authorized | W3 actual action manifest + independent correspondence verdict | Accuracy depends on quality of observed outcome evidence and comparison rules |
| A8 | Evidence omission attacker | Omit relevant observation or result evidence | W0 declared observation boundary, declared unknowns/redactions, W3 residual unknowns | IRP-1 cannot universally prove omitted evidence did not exist |
| A9 | Secret exfiltrator | Leak credentials/private evidence through receipts, bundles, or HCS | Privacy minimization, explicit public/private boundary, no-secret rules, later secret scan | Operational mistakes can still leak data before detection |
| A10 | Anchor substitution attacker | Present another HCS message/topic as the receipt’s anchor | Topic/sequence/payload/hash comparison and local/anchored digest equality | Depends on correct retrieval and verifier implementation |
| A11 | Mirror Node result substituter | Feed forged or mismatched retrieval data to a verifier | Verify topic, sequence, message payload, consensus timestamp and commitment equality; allow independent retrieval | Compromised network/client paths remain possible; multi-source retrieval may strengthen future profiles |
| A12 | Compromised host | Fabricate W0 observation or W3 outcome before hashing | Explicit host trust boundary; later external/receiver-side evidence MAY strengthen | IRP-1 v1 does not universally solve a fully compromised observation/execution host |
| A13 | Compromised AI | Produce false interpretation or harmful intent | W1 bounds and preserves declared interpretation/intent; policy/approval may constrain action | IRP-1 does not prove AI reasoning or interpretation true |
| A14 | Dishonest operator | Intentionally authorize harmful action or publish misleading evidence | Claim boundary, explicit policy/approval trail, public evidence, independent verdict dimensions | IRP-1 does not guarantee honest governance or ethical policy |
| A15 | Verifier bug | Miscompute hashes, policy, chain, anchor, or correspondence | Fixed compatibility vectors, adversarial cases, reproducible tests, independent review | A defective verifier can still produce wrong results |

## 4. Attack classes and required behavior

### 4.1 Mutation

Any change to canonicalized receipt content after digest creation SHOULD cause `HASH_MISMATCH` or an equivalent integrity failure.

A one-byte semantic mutation to an accepted value MUST result in a different canonical preimage and digest unless the mutation is semantically irrelevant under the frozen representation—which application profiles SHOULD avoid.

### 4.2 Parent-link rewriting

If `previousReceiptHash` does not equal the actual parent `receiptHash`, the verifier MUST report `PARENT_HASH_MISMATCH` or `CHAIN_BROKEN`.

If W2’s semantic `intentReceiptHash` or W3’s `authorizationReceiptHash` disagrees with the linked parent, the verifier MUST surface `SEMANTIC_PARENT_MISMATCH`.

### 4.3 Replay

Duplicate nonce use inside the defined replay domain MUST be rejected as `DUPLICATE_NONCE`.

A previously accepted W2 MUST NOT silently authorize a new execution event.

### 4.4 Unauthorized execution

Execution after a `BLOCKED`, `PENDING_APPROVAL`, or `UNRESOLVED` W2 MUST NOT be hidden by rewriting receipts.

The evidence chain MAY remain cryptographically intact while authorization validity fails. The verifier MUST preserve both results.

### 4.5 Divergence

If W2 authorizes one exact action manifest and the actual execution exceeds or differs from that manifest, W3 MUST report `DIVERGED` under the profile comparison rules.

The verifier MUST NOT invalidate an otherwise intact W2 merely because W3 diverged.

### 4.6 Evidence omission

W0 and W3 MUST support declared unknowns/residual unknowns and explicit redaction/evidence-boundary metadata.

These fields make the declared boundary inspectable. They do not prove completeness.

## 5. Host compromise boundary

A fully compromised local observation/execution host can potentially generate false W0 or W3 content and then hash it correctly.

IRP-1 therefore distinguishes:

```text
integrity of committed statement
!=
truth of committed statement
```

Future strengthening MAY compose with:

- receiver-signed action evidence;
- independent service attestations;
- hardware-backed execution evidence;
- trusted execution environment attestations;
- independent evidence providers.

Those mechanisms are extensions, not universal v1 claims.

## 6. AI compromise boundary

A compromised or mistaken AI can produce a false W1 interpretation or unsafe intended action.

IRP-1’s contribution is to preserve the declared interpretation and exact intended action before authorization, then expose the policy/approval path and later outcome correspondence.

The protocol does not prove the W1 interpretation true.

## 7. Operator and governance boundary

A dishonest or incompetent operator can approve a harmful action or choose a bad policy.

IRP-1 can expose that an approval/policy path existed; it does not make the policy or approver morally, scientifically, or legally correct.

## 8. Consensus boundary

Hedera consensus evidence can strengthen ordering/timestamp claims for minimized commitments.

It does not solve:

- false W0/W3 content;
- bad policy;
- dishonest approval;
- compromised execution host;
- verifier defects;
- semantic truth.

## 9. Privacy/security interaction

Security controls MUST NOT create new disclosure risk.

In particular:

- sensitive payloads MUST NOT be copied to HCS merely to make them “immutable”;
- low-entropy sensitive values MUST NOT be treated as safe merely because they are hashed;
- credentials/private keys MUST NOT appear in receipts, public bundles, logs, Drive handoff surfaces, or HCS;
- public evidence SHOULD contain only material required for independent verification.

## 10. Verification obligations

The reference implementation MUST include adversarial tests for at least:

- reordered object keys preserving the same canonical digest;
- one-byte/one-value mutation changing the digest;
- wrong parent hash;
- duplicate nonce;
- missing stage;
- bad stage order;
- invalid schema;
- child receipt predating parent;
- BLOCK followed by execution;
- required approval absent followed by execution;
- authorized action diverging from actual action.

## 11. Security claim boundary

IRP-1 MUST NOT be described as unhackable, tamper-proof, fully secure, or a universal solution to AI-agent security.

Its bounded security claim is that specified classes of mutation, chain failure, replay, authorization failure, anchor mismatch, and action divergence can be made independently detectable relative to committed evidence when the relevant implementation and evidence gates pass.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
