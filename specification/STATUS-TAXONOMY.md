# IRP-1 Status Taxonomy

**Protocol:** IRP-1  
**Schema version:** 1  
**Status:** SPECIFIED  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 1. Purpose

This document defines the maturity and gate-status vocabulary used by IRP-1, the AI WITNESS reference implementation, evidence reports, public demonstrations, and release decisions.

Status words MUST be evidence-bound. A later stage MUST NOT be inferred merely because an earlier stage exists.

## 2. Artifact maturity states

### SPECIFIED

The artifact or behavior has a written normative definition.

Evidence examples:

- public specification text;
- frozen schema or invariant definition;
- normative protocol requirement.

`SPECIFIED` does not mean code exists.

### IMPLEMENTED

Executable code implementing the specified behavior exists on the canonical engineering surface.

Evidence examples:

- committed source code;
- dependency lock state where relevant;
- implementation entry points.

`IMPLEMENTED` does not imply passing tests or independent verification.

### LOCALLY_VERIFIED

The implementation has passed its required verification suite in a controlled local environment.

This state MAY be used where local execution evidence is the actual verification surface.

Under the project’s cloud-native workflow, `REPRODUCIBLY_VERIFIED` is preferred when GitHub Actions or an equivalent reproducible canonical execution surface provides the evidence.

### REPRODUCIBLY_VERIFIED

The implementation has passed the required deterministic test/verification suite on a canonical reproducible execution surface whose output can be inspected independently.

Evidence examples:

- GitHub Actions workflow run tied to the exact commit;
- reproducible command/test evidence tied to an immutable source revision.

### TESTNET_ANCHORED

The relevant receipt commitment has genuine testnet consensus evidence meeting the profile requirements.

For the Hedera profile this requires, as applicable:

- genuine topic ID;
- genuine sequence number;
- genuine consensus timestamp;
- retrievable Mirror Node message;
- anchored payload matching the local commitment;
- local/anchored digest equality.

Synthetic placeholders MUST NOT qualify.

### PUBLICLY_REPRODUCIBLE

A third party can follow the published instructions and reproduce the relevant result using the public artifacts and evidence.

This state requires more than repository visibility. Required dependencies, inputs, commands, fixtures, and expected outcomes MUST be available to the extent needed for the bounded public proof.

### RELEASE_CANDIDATE

All required pre-release gates for a candidate release have passed, but the project has not yet declared the final public-proof release.

A release candidate MUST remain subject to the explicit GO_PUBLIC decision.

### PUBLIC_PROOF

The bounded public proof release has passed all applicable GO_PUBLIC gates and the supporting evidence is publicly inspectable.

`PUBLIC_PROOF` does not mean production readiness, legal compliance, semantic truth, complete security, or external endorsement.

### EXPERIMENTAL

The artifact is intentionally exploratory, incomplete, unstable, or outside the frozen public-proof contract.

Experimental features MUST NOT silently alter the meaning of stable IRP-1 v1 receipts.

### DEPRECATED

The artifact or profile remains historically relevant but is no longer the recommended active surface.

Deprecated artifacts MUST NOT be silently rewritten into a newer meaning. Historical receipt interpretation MUST remain version-aware.

## 3. Gate statuses

### PASS

All requirements of the named gate have been satisfied with inspectable evidence.

A gate MUST NOT be reported `PASS` by assumption.

### HOLD

The gate cannot advance because one or more required conditions are unresolved, unavailable, or not yet evidenced.

`HOLD` is not failure of the project; it is an explicit stop condition.

### FAIL

A required condition has been tested or inspected and found to violate the gate.

A `FAIL` MUST record the failing condition and evidence.

### NOT_TESTED

The condition has not yet been tested.

`NOT_TESTED` MUST NOT be represented as `PASS`.

### NOT_APPLICABLE

The condition is explicitly outside the scope of the artifact or profile being evaluated.

`NOT_APPLICABLE` SHOULD include the reason it does not apply.

## 4. Evidence precedence

For implementation-state claims, evidence precedence is:

1. canonical repository revision and reproducible command/workflow evidence;
2. public evidence bundles and external anchor evidence;
3. human-readable engineering handoff;
4. manuscript or narrative description.

If narrative and executable evidence disagree, the executable evidence controls and the narrative MUST be corrected.

## 5. Non-equivalence rules

The following equivalences are prohibited:

```text
SPECIFIED != IMPLEMENTED
IMPLEMENTED != VERIFIED
VERIFIED != TESTNET_ANCHORED
TESTNET_ANCHORED != PUBLICLY_REPRODUCIBLE
PUBLICLY_REPRODUCIBLE != PUBLIC_PROOF
PUBLIC_PROOF != PRODUCTION_READY
NOT_TESTED != PASS
```

## 6. Phase reporting format

Every phase closure SHOULD record:

- phase identifier;
- gate status;
- repository commit;
- canonical branch;
- files created/modified;
- commands/workflows run;
- tests and results;
- evidence references;
- blockers;
- security findings;
- claim-boundary findings;
- Hedera evidence state where applicable;
- next authorized phase.

## 7. Current Phase-1 interpretation

The six public protocol files created by AIW-Ω1 are `SPECIFIED` artifacts.

They MUST NOT be described as `IMPLEMENTED`, `REPRODUCIBLY_VERIFIED`, `TESTNET_ANCHORED`, `PUBLICLY_REPRODUCIBLE`, `RELEASE_CANDIDATE`, or `PUBLIC_PROOF` merely because the specification exists.

## 8. Permanent claim boundary

Maturity status never changes the semantic-truth boundary.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
