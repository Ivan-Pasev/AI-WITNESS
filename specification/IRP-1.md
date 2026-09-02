# IRP-1 — Interpretation Receipt Protocol v1

**Protocol identity:** `IRP-1`  
**Schema version:** `1`  
**Status:** SPECIFIED  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 1. Scope

IRP-1 is a deterministic action-correspondence protocol for recording and independently checking the relationship between what an AI-agent system declared it observed, what it declared it intended to do, what deterministic policy and human authority allowed, and what the executor was observed to have produced.

The canonical receipt sequence is:

```text
W0_OBSERVATION
  -> W1_INTENT
  -> W2_AUTHORIZATION
  -> W3_OUTCOME
```

IRP-1 is not a semantic-truth protocol. It does not prove that an interpretation was correct, that evidence was complete, that an action was ethical, that an operator was honest, that a host was uncompromised, or that a system is legally compliant or completely secure.

Normative terms **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are used in their ordinary RFC-style normative sense.

## 2. Design separation

A conforming implementation MUST keep the following questions distinct:

1. **Receipt integrity** — were committed receipt bytes modified?
2. **Chain validity** — are stage order, parent links, session identity, replay controls, and local time relations valid?
3. **Policy** — what deterministic verdict results from the declared policy material and declared input?
4. **Approval** — was required approval recorded before authorization/execution?
5. **Authorization** — was the exact action manifest authorized before execution?
6. **Consensus evidence** — is the claimed external anchor independently retrievable and matching?
7. **Correspondence** — did the observed action correspond to the authorized action manifest?
8. **Semantic truth** — was the interpretation itself true?

The first seven are protocol-verification dimensions when their required evidence exists. The eighth is explicitly outside IRP-1.

A verifier MUST NOT collapse these dimensions into a single trust score, truth percentage, certification, or generic “AI verified” state.

## 3. Protocol identity and receipt envelope

Every IRP-1 v1 receipt MUST contain the following envelope fields:

```json
{
  "protocol": "IRP-1",
  "schemaVersion": "1",
  "receiptKind": "W0_OBSERVATION | W1_INTENT | W2_AUTHORIZATION | W3_OUTCOME",
  "receiptId": "opaque-string",
  "sessionId": "opaque-string",
  "nonce": "opaque-string",
  "createdAt": "RFC3339-UTC-timestamp",
  "previousReceiptHash": null,
  "payload": {},
  "receiptHash": "lowercase-sha256-hex"
}
```

### 3.1 Envelope requirements

- `protocol` MUST equal `IRP-1`.
- `schemaVersion` MUST equal `1`.
- `receiptKind` MUST be one of the four frozen stage identifiers.
- `receiptId` MUST be non-empty and MUST be unique within the session.
- `receiptId` is an opaque identifier; IRP-1 does not require UUID semantics.
- `sessionId` MUST be non-empty and MUST be identical across a valid W0→W1→W2→W3 chain.
- `nonce` MUST be non-empty and MUST be unique within the replay domain defined in Section 10.
- `createdAt` MUST be an unambiguous RFC 3339 UTC timestamp using `Z`.
- `previousReceiptHash` MUST be `null` for W0 and a lowercase 64-hex-character SHA-256 digest for W1, W2, and W3.
- `payload` MUST satisfy the stage-specific schema.
- `receiptHash` MUST be the digest computed under Section 9.

## 4. W0 — Observation Receipt

`W0_OBSERVATION` commits to the system’s **declared observation boundary before interpretation**.

A W0 payload MUST contain:

```json
{
  "observationScope": {},
  "evidenceManifest": [],
  "repositoryState": {},
  "constraints": [],
  "declaredUnknowns": [],
  "redactions": []
}
```

The concrete content of these fields is application-profile specific but MUST remain inside the IRP-1 accepted value domain.

W0 MUST NOT be represented as proof that:

- all relevant evidence was observed;
- the observed evidence was true;
- omitted evidence did not exist;
- the host environment was uncompromised;
- the AI interpreted the evidence correctly.

W0 is the root receipt and MUST use `previousReceiptHash: null`.

## 5. W1 — Intent Receipt

`W1_INTENT` commits to a bounded declared interpretation and the exact intended action **before authorization**.

A W1 payload MUST contain:

```json
{
  "interpretation": {},
  "assumptions": [],
  "uncertainty": {
    "known": [],
    "uncertain": [],
    "unknown": [],
    "limitations": []
  },
  "intendedAction": {},
  "actionManifest": {},
  "expectedEffect": {},
  "policyRef": {},
  "approvalExpectation": {}
}
```

The W1 `actionManifest` is the primary later correspondence surface. An application profile MAY include fields such as operation, target paths/resources, expected patch or request digest, expected file/resource manifest, and expected change count.

W1 MUST NOT require private chain-of-thought. It records only the bounded interpretation, assumptions, uncertainty, intended action, and other declared protocol data needed for later verification.

W1 is **not authorization**.

## 6. W2 — Authorization Receipt

`W2_AUTHORIZATION` commits to the deterministic policy path, approval state, authorization verdict, and exact authorized action manifest **before execution**.

A W2 payload MUST contain:

```json
{
  "intentReceiptHash": "sha256-hex",
  "policy": {
    "id": "opaque-string",
    "version": "opaque-string"
  },
  "policyHash": "sha256-hex",
  "policyInput": {},
  "policyEvaluation": [],
  "policyVerdict": "ALLOW | BLOCK | ESCALATE",
  "approvalRequirement": {},
  "approvalState": "NOT_REQUIRED | REQUIRED_PENDING | REQUIRED_APPROVED | REQUIRED_REJECTED | INVALID",
  "authorizationVerdict": "AUTHORIZED | BLOCKED | PENDING_APPROVAL | UNRESOLVED",
  "authorizedActionManifest": {},
  "authorizationConstraints": []
}
```

`intentReceiptHash` MUST equal the hash of the W1 receipt linked by `previousReceiptHash`.

### 6.1 Rule-level policy results

Each deterministic rule result MUST be one of:

- `PASS`
- `FAIL`
- `UNKNOWN`

### 6.2 Aggregate policy verdict

The reference aggregation is frozen:

```text
if any rule == FAIL:
    BLOCK
else if any rule == UNKNOWN:
    ESCALATE
else:
    ALLOW
```

A public policy result SHOULD be independently reproducible from the versioned policy material, policy hash, declared inputs, and rule semantics.

The reference public-proof profile MUST NOT contain a hidden administrator bypass.

### 6.3 Authorization constraints

- `BLOCK` MUST produce `BLOCKED`.
- `ESCALATE` MUST NOT be silently treated as `ALLOW`.
- If required approval is not already `REQUIRED_APPROVED`, execution MUST NOT be represented as authorized.
- `AUTHORIZED` MUST bind the exact authorized action manifest and declared authorization constraints.
- A W2 MUST exist before an execution can be represented as authorized.
- If execution occurs despite `BLOCKED`, `PENDING_APPROVAL`, or `UNRESOLVED`, the evidence MUST be retained and the verifier MUST report the authorization failure rather than rewrite W2.

## 7. Approval state

IRP-1 v1 freezes these approval states:

- `NOT_REQUIRED`
- `REQUIRED_PENDING`
- `REQUIRED_APPROVED`
- `REQUIRED_REJECTED`
- `INVALID`

An approval record MAY include an approver reference, recorded timestamp, evidence reference, and scope.

A recorded approval state does **not** by itself prove the real-world identity of an approver. Strong identity assurance belongs to an external authentication/signature layer.

## 8. W3 — Outcome Receipt

`W3_OUTCOME` records the observed post-action result without rewriting W2.

A W3 payload MUST contain:

```json
{
  "authorizationReceiptHash": "sha256-hex",
  "executionState": "EXECUTED | NOT_EXECUTED | PARTIALLY_EXECUTED | EXECUTION_UNKNOWN",
  "actualActionManifest": {},
  "observedResult": {},
  "correspondenceVerdict": "MATCH | PARTIAL_MATCH | DIVERGED | NOT_EXECUTED",
  "violations": [],
  "residualUnknowns": []
}
```

`authorizationReceiptHash` MUST equal the hash of the W2 receipt linked by `previousReceiptHash`.

### 8.1 Correspondence verdicts

- `MATCH` — the observed actual action manifest satisfies the exact comparison rules for the authorized action manifest.
- `PARTIAL_MATCH` — some authorized effects occurred, but the observed result is incomplete relative to the authorized action or profile-specific comparison requirements.
- `DIVERGED` — execution occurred but the actual action manifest differs from or exceeds what W2 authorized.
- `NOT_EXECUTED` — no execution occurred.

An intact W2 MAY coexist with a `DIVERGED` W3. This is a core IRP-1 property: cryptographic integrity does not imply faithful execution.

A `MATCH` verdict does not prove that the interpretation or decision was correct, safe, ethical, or lawful.

## 9. Canonicalization and hashing

### 9.1 Normative canonicalization

IRP-1 v1 uses **RFC 8785 — JSON Canonicalization Scheme (JCS)** as the normative canonical JSON algorithm.

Before JCS serialization, an implementation MUST validate input against an IRP-1 **I-JSON-compatible accepted-value subset**.

The accepted protocol value domain is limited to JSON values that can be represented deterministically under the frozen profile:

- `null`;
- booleans;
- JSON strings valid for the JCS/I-JSON profile;
- finite JSON numbers accepted by the JCS/I-JSON profile;
- arrays containing accepted values;
- objects with string member names and accepted values.

Implementations MUST reject unsupported runtime values before canonicalization. Examples include `undefined`, non-finite numbers, functions, symbols, cyclic structures, implicit runtime-specific date objects, arbitrary binary objects, and class instances that have not first been explicitly converted to an accepted JSON representation.

Implementations MUST NOT silently coerce unsupported runtime values into a different semantic value merely to obtain a digest.

Fixed cross-implementation compatibility vectors are REQUIRED before implementation maturity can advance beyond `IMPLEMENTED`.

An incompatible change to canonicalization behavior requires a new schema/version. Historical receipts MUST NOT be silently migrated.

### 9.2 Domain separation

The exact domain separators are:

```text
W0_OBSERVATION   -> IRP1:OBSERVATION
W1_INTENT        -> IRP1:INTENT
W2_AUTHORIZATION -> IRP1:AUTHORIZATION
W3_OUTCOME       -> IRP1:OUTCOME
```

### 9.3 Hash preimage

`receiptHash` MUST be excluded from its own hash preimage.

The normative preimage object is:

```json
{
  "domain": "IRP1:...",
  "protocol": "IRP-1",
  "schemaVersion": "1",
  "receiptKind": "W...",
  "previousReceiptHash": null,
  "body": {
    "receiptId": "...",
    "sessionId": "...",
    "nonce": "...",
    "createdAt": "...",
    "payload": {}
  }
}
```

The implementation MUST:

1. construct this preimage object;
2. validate it against the IRP-1 accepted value domain;
3. serialize it using RFC 8785/JCS;
4. encode the canonical JSON as UTF-8;
5. compute SHA-256 over those bytes;
6. encode the digest as lowercase hexadecimal.

This structured preimage is normative and avoids ambiguous raw-string concatenation.

## 10. Replay and local time

The v1 replay domain is the tuple:

```text
(protocol, schemaVersion, sessionId)
```

Within that replay domain:

- each `nonce` MUST be unique;
- each `receiptId` MUST be unique;
- a previously accepted W2 MUST NOT silently authorize a new execution event;
- duplicate submission of the same receipt, replay of an authorization for a new action, and re-anchoring of an existing digest MUST be treated as distinct events by profiles that support them.

A child receipt’s `createdAt` MUST NOT predate its parent’s `createdAt`.

Local receipt timestamps are chain-sanity metadata only. They do not independently establish objective chronology. An external consensus timestamp, when used, is a separate evidence layer.

## 11. Chain validity

A canonical linear chain MUST satisfy all of the following:

1. W0 is the root.
2. `W0.previousReceiptHash == null`.
3. `W1.previousReceiptHash == W0.receiptHash`.
4. `W2.previousReceiptHash == W1.receiptHash`.
5. `W3.previousReceiptHash == W2.receiptHash`.
6. W2 `intentReceiptHash == W1.receiptHash`.
7. W3 `authorizationReceiptHash == W2.receiptHash`.
8. protocol and schema identity are compatible across all stages.
9. `sessionId` is identical across all stages.
10. stage order is exactly W0→W1→W2→W3.
11. nonces are valid under the replay domain.
12. child local timestamps do not predate parents.
13. a canonical linear session contains at most one canonical receipt for each stage.

If multiple valid children claim the same parent/stage position, the verifier MUST report `FORK_DETECTED`. It MUST NOT silently choose one branch as canonical without an external profile rule.

## 12. Formal invariant register

The following invariants are frozen for v1:

| ID | Invariant |
|---|---|
| IRP-INV-001 | Exact stage order W0→W1→W2→W3 |
| IRP-INV-002 | Correct parent-hash linkage |
| IRP-INV-003 | `receiptHash` excluded from its own preimage |
| IRP-INV-004 | Receipt-kind domain separation |
| IRP-INV-005 | RFC 8785/JCS deterministic canonicalization |
| IRP-INV-006 | Unsupported values rejected rather than coerced |
| IRP-INV-007 | Session identity continuity |
| IRP-INV-008 | Nonce-based replay resistance in the defined domain |
| IRP-INV-009 | Monotonic local receipt time |
| IRP-INV-010 | Authorization exists before authorized execution |
| IRP-INV-011 | BLOCK is non-authorization |
| IRP-INV-012 | Required approval precedes authorization |
| IRP-INV-013 | W2 binds the exact W1 intent/action manifest |
| IRP-INV-014 | W3 cannot rewrite W2 |
| IRP-INV-015 | Divergence remains visible even when integrity is valid |
| IRP-INV-016 | Integrity and semantic truth remain separate |
| IRP-INV-017 | Public consensus anchoring is minimized |
| IRP-INV-018 | Verifier dimensions remain independent |

## 13. Failure semantics

Implementations SHOULD expose stable failure categories including:

- `INVALID_SCHEMA`
- `UNSUPPORTED_VALUE`
- `CANONICALIZATION_FAILURE`
- `HASH_MISMATCH`
- `PARENT_HASH_MISMATCH`
- `SEMANTIC_PARENT_MISMATCH`
- `SESSION_MISMATCH`
- `DUPLICATE_NONCE`
- `INVALID_STAGE_ORDER`
- `MISSING_STAGE`
- `TIME_ORDER_VIOLATION`
- `POLICY_BLOCK`
- `POLICY_ESCALATE`
- `APPROVAL_REQUIRED`
- `APPROVAL_INVALID`
- `UNAUTHORIZED_EXECUTION`
- `ACTION_DIVERGENCE`
- `ANCHOR_NOT_FOUND`
- `ANCHOR_MISMATCH`
- `FORK_DETECTED`

These are protocol categories. A particular implementation MAY use more specific internal error types as long as externally visible semantics remain compatible.

## 14. Verifier taxonomy

A conforming public verifier MUST preserve independent verdict dimensions.

### Receipt integrity

- `INTACT`
- `MODIFIED`
- `MISSING`

### Chain

- `CHAIN_VALID`
- `CHAIN_BROKEN`
- `FORK_DETECTED`

### Consensus

- `ANCHORED`
- `NOT_FOUND`
- `TOPIC_MISMATCH`
- `SEQUENCE_MISMATCH`
- `NOT_CHECKED`

### Policy

- `ALLOW`
- `BLOCK`
- `ESCALATE`
- `POLICY_UNKNOWN`

### Approval

- `NOT_REQUIRED`
- `REQUIRED_AND_APPROVED`
- `REQUIRED_NOT_APPROVED`
- `INVALID`

### Correspondence

- `MATCH`
- `PARTIAL_MATCH`
- `DIVERGED`
- `NOT_EXECUTED`

Every public verifier surface MUST display:

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 15. Digest, signature, and consensus layers

IRP-1 separates three evidence layers:

1. **Receipt digest** — REQUIRED for v1 integrity and chaining.
2. **Issuer/approver signature** — OPTIONAL/reserved in v1 and MAY be deferred in the v0.1 public proof if the limitation is explicit.
3. **Consensus anchor** — OPTIONAL for general IRP-1; REQUIRED by the Hedera public-proof profile.

SHA-256 alone does not authenticate the real-world identity of an actor or approver.

A future signature profile SHOULD reuse interoperable structures, such as COSE/SCITT-compatible signed statements where suitable, rather than introduce avoidable proprietary signature-envelope semantics.

## 16. Hedera public-proof profile

Hedera Consensus Service is used only as a public ordering/timestamp substrate for minimized commitments. It is not a semantic-truth authority.

The minimized anchor material SHOULD contain only:

```json
{
  "protocol": "IRP-1",
  "schemaVersion": "1",
  "receiptId": "...",
  "receiptKind": "...",
  "receiptHash": "...",
  "previousReceiptHash": null,
  "publicManifestHash": "..."
}
```

For the Hedera public-proof profile:

- W2 commitment MUST be anchored before execution when the action is authorized for execution;
- the W2 anchor MUST be independently retrieved before the proof proceeds to execution when the demonstration profile requires that ordering evidence;
- W3 commitment MUST be anchored after the observed execution/block outcome;
- topic ID, sequence number, consensus timestamp, anchored payload, and local/anchored digest equality MUST be checked through a Mirror Node or equivalent independently retrievable Hedera evidence surface.

The following MUST NOT be placed on HCS in the public proof:

- raw prompts;
- source files;
- full private patches;
- personal or customer data;
- private evidence;
- private keys or credentials;
- confidential policy internals;
- confidential invention material.

## 17. SCITT interoperability boundary

Current adjacent SCITT work includes Internet-Drafts for AI-agent action receipts, action capsules, pre-execution authorization records, closure/outcome structures, selective disclosure, provenance binding, and composite evidence.

These are works in progress and MUST NOT be described by IRP-1 as adopted standards merely because they are present on the IETF Datatracker.

IRP-1 v1 is independently implementable and independently verifiable.

A future SCITT mapping/export profile is an interoperability seam, not part of the v0.1 public proof and not a replacement for SCITT.

IRP-1 MUST NOT claim invention of the generic concepts of signed action receipts, pre-execution permits, authorization-to-dispatch binding, or transparency receipts.

## 18. Three public proof cases

The initial reference implementation MUST demonstrate at least:

### A — ALLOW_AND_MATCH

- policy: `ALLOW`;
- required approval: approved;
- W2: `AUTHORIZED`;
- execution: `EXECUTED`;
- W3 correspondence: `MATCH`.

### B — BLOCK_AND_NOT_EXECUTED

- at least one deterministic rule: `FAIL`;
- policy: `BLOCK`;
- W2: `BLOCKED`;
- execution: `NOT_EXECUTED`;
- W3 correspondence: `NOT_EXECUTED`.

### C — ALLOW_BUT_DIVERGED

- policy: `ALLOW`;
- W2: `AUTHORIZED`;
- execution occurs;
- actual action manifest differs from or exceeds authorized action manifest;
- W3 correspondence: `DIVERGED`;
- the receipt chain MAY remain cryptographically intact.

Case C is required because it demonstrates the protocol’s central separation between integrity and faithful execution.

## 19. Non-goals

IRP-1 does not claim to prove:

- semantic truth;
- correctness of hidden reasoning;
- complete evidence capture;
- ethical correctness;
- legal or regulatory compliance;
- complete AI alignment;
- complete system security;
- honest operator behavior;
- uncompromised execution hosts;
- real-world actor identity without an external authentication/signature layer.

## 20. References

- RFC 8785 — JSON Canonicalization Scheme (JCS): https://www.rfc-editor.org/rfc/rfc8785.html
- Phase 0.5 opportunity/interoperability freeze: `reports/00.5-opportunity-positioning.md`
- IETF SCITT document register: https://datatracker.ietf.org/wg/scitt/documents/
- SCITT Pre-Execution Authorization / Permit profile: https://datatracker.ietf.org/doc/draft-munoz-scitt-permit-profile/

---

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
