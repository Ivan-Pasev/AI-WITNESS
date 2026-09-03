# AIW-Ω8 — Public Release Candidate

## Phase
AIW-Ω8 — PUBLIC RELEASE CANDIDATE

## Status
PASS — RC accepted; publication remains a separate evidence-bearing action.

## Entry boundary
`a7bed674ab13fba2fdaac6c1eadc9561adc52bdc` — Phase-7 closure.

Permanent boundary: **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**.

## Release identity
The bounded public-proof release-candidate identity is `v0.1.0-rc.1`.

This is a GitHub/public-proof release identity, not an npm publication and not a production-readiness claim. `package.json` remains `private: true` with historical internal metadata `0.1.0-preproof`; public RC authority is the repository manifest plus exact accepted Git commit and validation evidence.

## Deterministic manifest
`release/irp1-v0.1.0-rc.1.json` binds IRP-1/schemaVersion 1, runtime, public policy and hash, three canonical cases, Hedera testnet topic/evidence index, verifier commands, public inventory, and the permanent claim boundary.

The manifest uses `canonicalCommit: SELF` to avoid an impossible Git self-hash dependency. `SELF` means the Git commit containing the manifest. Exact accepted closure SHA is recorded externally in the canonical engineering handoff after the closure commit itself passes CI.

## Candidate validation evidence
Candidate commit:
`5fcd1a68f40eb3088036ec277b79fbd1a1ddb951`

Temporary verification ref:
`aiw-omega8-final-verify-v1`

GitHub Actions:
- run `33765093095` — PASS;
- job `100680792248` — PASS;
- Ubuntu 24.04.4;
- Node 22.23.2;
- npm 10.9.8;
- actions/checkout@v7;
- actions/setup-node@v7.

Gate results:
- `npm ci`: PASS;
- `npm audit`: 0 vulnerabilities reported by the current npm advisory database;
- `npm run typecheck`: PASS;
- `npm test`: 157 PASS / 0 FAIL;
- `npm run verify:public -- local`: PASS for all three cases with independent policy replay;
- `npm run verify:public -- network`: aggregate `ANCHORED`, all six topic `0.0.10345032` W2/W3 anchors independently retrieved and matched.

The exact closure commit containing this finalized report must pass the same gate before non-forced promotion to `main`. That closure SHA/run is recorded in the canonical engineering handoff because a Git commit cannot truthfully contain its own final SHA plus future workflow run identifier.

## Public surface reconciliation
README, specification, reports, local receipt bundles, public Hedera evidence, verifier surfaces, RC manifest and checklist are coherent around the bounded RC identity. Historical phase reports remain historical evidence and are not rewritten to cosmetically replace original candidate-state text.

The browser verifier remains explicitly weaker than the TypeScript verifier wherever equivalent cryptographic/live-network checks are not performed.

## Pages decision
`DEFERRED_NOT_DEPLOYED`.

The static browser verifier exists under `public/verifier/`, but no deployed Pages service or URL is claimed. The current connected repository action surface does not provide an evidenced Pages settings/deployment operation. Pages is supplemental rather than required for RC acceptance because the authoritative verifier is reproducible directly from the repository.

## Branch / ruleset / signing decision
At Phase-8 entry, `main` is unprotected and historical commits are unsigned. History is not rewritten.

The current connected action surface permits reading branch/ruleset state but does not provide a supported branch-protection/ruleset write action or GitHub-release creation action. Therefore no protection, tag, signature, release, or Pages publication status is fabricated. Forward provenance hardening is carried into the dedicated publication closure step.

## Dependency / maintenance boundary
`@hiero-ledger/sdk` remains pinned to 2.87.0 with `protobufjs` 8.6.6 and `ws` 8.21.0 overrides. `crypto-js@4.2.0` remains an unmaintained transitive dependency and is explicitly tracked as maintenance debt. Current `npm audit` zero-finding evidence does not prove complete software security.

## Security / claim gate
No live key, `.env` value, customer/personal data, private evidence, or confidential invention note is intentionally introduced by the RC metadata surfaces.

No claim is authorized for semantic truth, guaranteed correctness, complete security, legal compliance/certification, Hedera endorsement, broad first-ever novelty, or production readiness.

## Standards position
Phase-7 standards findings remain controlling for this RC: SCITT includes RFC 9943 as a Proposed Standard plus active adjacent Internet-Drafts. IRP-1 does not claim invention of generic signed AI receipts or generic pre-execution authorization binding. Differentiation remains the integrated action-correspondence system, deterministic policy replay, explicit approval ordering, separated verifier verdicts, and Hedera-native pre/post evidence profile.

## Phase adjudication
`PHASE_8: PASS`

`RELEASE_CANDIDATE: v0.1.0-rc.1 — RC_ACCEPTED_NOT_PUBLISHED`

`GO_PUBLIC: HOLD_PUBLICATION_ACTION_REQUIRED`

No GitHub tag/release, signed artifact, or Pages URL is claimed by Phase 8.

## Next authorized action
`AIW-Ω8R — PUBLIC RELEASE / GO_PUBLIC CLOSURE`

Phase 9 Agent Kit/MCP integration remains unauthorized until the publication closure is explicitly adjudicated.

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
