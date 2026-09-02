# IRP-1 Claim Boundary

**Protocol:** IRP-1  
**Schema version:** 1  
**Status:** SPECIFIED  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 1. Purpose

This document defines the permanent public claim boundary for IRP-1 and the AI WITNESS reference implementation.

IRP-1 is intentionally narrow. Its value depends on preserving distinctions between evidence integrity, authorization, consensus ordering, correspondence, identity, security, and semantic truth.

## 2. What IRP-1 may establish

When the corresponding implementation and verification gates are evidenced, IRP-1 may establish or support independently checkable evidence for:

- deterministic receipt canonicalization;
- receipt digest integrity;
- cryptographic parent linkage;
- W0→W1→W2→W3 stage ordering;
- nonce/replay validation in the defined replay domain;
- deterministic policy-path disclosure and replay when public policy material is available;
- recorded human-approval state;
- pre-execution authorization ordering;
- exact binding between W1 intent and W2 authorized action manifest;
- observed W3 action/result recording;
- action-correspondence verdicts;
- independently retrievable Hedera consensus ordering/timestamp evidence for minimized anchored commitments in the Hedera profile;
- local/anchored digest comparison;
- detection of specified mutation, chain, policy, approval, authorization, anchor, and divergence failures.

## 3. What IRP-1 does not establish

IRP-1 does **not** prove:

- that an AI interpretation is true;
- that an AI’s private reasoning or chain-of-thought is correct;
- that all relevant evidence was observed;
- that evidence sources were truthful;
- that the observation/execution host was uncompromised;
- that a human approver identity is authentic merely because a name or identifier is recorded;
- that an authorized action is safe, ethical, beneficial, or factually correct;
- that a matching execution was a good decision;
- that a system is legally or regulatorily compliant;
- that the implementation is free of vulnerabilities;
- that an operator is honest;
- that the system is completely aligned or completely secure;
- that Hedera, HCS, a Mirror Node, or any external organization endorses the project.

## 4. Integrity is not truth

A cryptographically intact receipt can preserve a false statement exactly.

Therefore:

```text
RECEIPT INTACT
!=
SEMANTICALLY TRUE
```

A verifier MUST NOT convert `INTACT` into “true,” “correct,” “verified AI,” or any equivalent semantic judgment.

## 5. Authorization is not correctness

A policy and human authority can authorize a harmful, mistaken, or undesirable action.

Therefore:

```text
AUTHORIZED
!=
CORRECT
!=
SAFE
!=
LAWFUL
```

IRP-1 records and verifies authorization state. It does not determine whether the underlying policy or human decision was normatively correct.

## 6. Consensus ordering is not truth

A Hedera consensus timestamp or sequence number can provide independently retrievable evidence that a commitment appeared in a particular consensus order/time relation.

It does not prove that the committed content was true.

Therefore:

```text
ANCHORED
!=
TRUE
```

The Hedera public-proof profile MUST describe HCS as an ordering/timestamp substrate for minimized commitments, not as a semantic-truth oracle.

## 7. Correspondence is not correctness

`MATCH` means the observed action satisfies the frozen comparison rules for the authorized action manifest.

It does not mean the intended action was wise, safe, lawful, ethical, or factually justified.

Similarly, `DIVERGED` means the observed action differed from or exceeded the authorization; it does not by itself identify motive, blame, or legal consequence.

## 8. Chain integrity is not authorization validity

A receipt chain MAY be cryptographically intact while containing execution that was not authorized.

Example:

- W2 records `BLOCKED`;
- execution nevertheless occurs;
- W3 records the observed execution;
- hashes and parent links remain intact.

The verifier MUST preserve both facts:

- chain/integrity result;
- authorization failure, including `UNAUTHORIZED_EXECUTION` where applicable.

The verifier MUST NOT “repair” evidence by rewriting W2 or suppressing W3.

## 9. Identity and signature limitation

IRP-1 v1 distinguishes:

1. receipt digest integrity;
2. actor/approver origin authentication or signature;
3. external consensus anchoring.

A SHA-256 digest does not authenticate real-world identity.

A recorded approver reference is not identity proof by itself.

The v0.1 public proof MAY defer signatures if this limitation remains explicit. A future signature profile SHOULD reuse interoperable authenticated-statement structures where suitable.

## 10. Security limitation

IRP-1 is designed to make specified forms of silent rewriting, replay, authorization bypass, anchor mismatch, and action divergence detectable relative to committed evidence.

It does not guarantee complete system security.

In particular, a fully compromised host may fabricate the local observation it places into W0 or the local outcome it places into W3. External receiver-side attestations, hardware-backed evidence, trusted-execution attestations, or independent evidence providers are possible strengthening layers, not current universal claims.

Forbidden unqualified wording includes:

- “unhackable”;
- “tamper-proof”;
- “fully secure”;
- “guaranteed secure.”

Use “tamper-evident” only when the relevant implementation evidence exists.

## 11. Legal and compliance limitation

IRP-1 is not a legal-compliance certification system.

It MAY supply evidence useful to governance, audit, assurance, or compliance processes, but it MUST NOT be described as automatically establishing compliance with any law, regulation, standard, contract, or internal policy.

Forbidden unqualified wording includes:

- “legally compliant”;
- “regulator approved”;
- “compliance certified.”

## 12. Hedera endorsement boundary

Use of Hedera technologies, testnet, HCS, Mirror Node APIs, Hedera Agent Kit, or Hedera ecosystem documentation does not imply endorsement, approval, certification, partnership, investment, grant award, or validation by Hedera, Hedera Council members, The Hashgraph Association, or any related organization.

Do not use:

- “endorsed by Hedera”;
- “approved by Hedera”;
- “Hedera certified”;

unless explicit documentary evidence later exists and the wording is factually exact.

## 13. Novelty boundary

IRP-1 MUST NOT claim invention of the generic categories of:

- AI-agent action receipts;
- signed action receipts;
- cryptographic AI audit trails;
- pre-execution authorization records/permits;
- authorization-to-dispatch binding;
- transparency receipts;
- generic immutable AI logs.

Current SCITT-related Internet-Drafts materially overlap those categories.

The bounded differentiating position is the integrated action-correspondence chain combining:

```text
declared observation
-> bounded declared interpretation + exact intended action
-> deterministic policy replay
-> explicit approval state
-> pre-action authorization commitment
-> observed outcome
-> independent correspondence verdict
-> optional Hedera consensus evidence
```

Even this combination MUST be described as project positioning and implementation design, not as an unqualified first-ever claim.

## 14. Required public wording

The following sentence MUST appear prominently on public verifier surfaces and SHOULD appear on public protocol/evidence surfaces:

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

Recommended bounded language, when evidenced:

- “tamper-evident receipt chain”;
- “cryptographically linked receipts”;
- “deterministically verifiable”;
- “policy-replayable”;
- “pre-action authorization commitment”;
- “action-correspondence verdict”;
- “consensus-timestamped commitment” for an actually anchored Hedera profile;
- “publicly reproducible” only when reproduction evidence exists.

## 15. Forbidden or high-risk wording

Do not use as public claims without exceptional, independent evidence:

- “proves truth”;
- “AI verified”;
- “guarantees correctness”;
- “fully secure”;
- “tamper-proof”;
- “unhackable”;
- “legally compliant”;
- “certified”;
- “endorsed by Hedera”;
- “approved by Hedera”;
- “first ever”;
- “first AI receipt protocol”;
- “first pre-action authorization proof”;
- “first cryptographic AI audit trail”;
- “production ready” before release/security evidence.

## 16. Evidence-bound phrasing rule

A statement about implementation maturity MUST be no stronger than the evidence state defined in `STATUS-TAXONOMY.md`.

Examples:

- specification text alone supports `SPECIFIED`, not `IMPLEMENTED`;
- code without passing verification does not support `REPRODUCIBLY_VERIFIED`;
- an unsubmitted Hedera payload does not support `TESTNET_ANCHORED`;
- a draft verifier does not support `PUBLIC_PROOF`;
- `NOT_TESTED` is never equivalent to `PASS`.

## 17. Permanent boundary

The project may improve implementation, signatures, external evidence, consensus profiles, interoperability, and institutional deployment. Those upgrades do not remove the permanent distinction between preserving a statement and proving that statement semantically true.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
