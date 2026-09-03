# AIW-Ω8 — Public Release Candidate

## Phase
AIW-Ω8 — PUBLIC RELEASE CANDIDATE

## Status
CANDIDATE — exact-commit validation required before PASS.

## Entry boundary
`a7bed674ab13fba2fdaac6c1eadc9561adc52bdc` — Phase-7 closure.

Permanent boundary: **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**.

## Release identity
The bounded public-proof release-candidate identity is `v0.1.0-rc.1`.

This is a GitHub/public-proof release identity, not an npm publication and not a production-readiness claim. `package.json` remains `private: true` with historical internal metadata `0.1.0-preproof`; the public RC authority is the repository manifest plus exact accepted Git commit and validation evidence.

## Deterministic manifest
`release/irp1-v0.1.0-rc.1.json` binds the RC to:
- IRP-1 / schemaVersion 1;
- Node >=22 <23;
- public policy `github-demo-policy` v1 and its frozen hash;
- ALLOW_AND_MATCH, BLOCK_AND_NOT_EXECUTED, and ALLOW_BUT_DIVERGED;
- Hedera testnet topic `0.0.10345032` and six-anchor evidence index;
- authoritative TypeScript verification commands;
- public specification/report/evidence inventory;
- permanent claim boundary.

The manifest uses `canonicalCommit: SELF` to avoid an impossible Git self-hash dependency. `SELF` means the commit containing the manifest; the accepted SHA and external Actions run are recorded here and in the canonical engineering handoff after the exact candidate is exercised.

## Public surface reconciliation
The README now identifies the RC without implying that a GitHub release, tag, signed artifact, or Pages deployment already exists. The browser verifier remains explicitly weaker than the TypeScript verifier wherever equivalent cryptographic/live-network verification is not performed.

Historical Phase reports remain historical evidence and are not rewritten merely to cosmetically replace their original candidate-state prose.

## Pages decision
Status: `DEFERRED_NOT_DEPLOYED`.

The repository contains the static browser surface under `public/verifier/`, but this phase does not claim a deployed Pages service or URL because the currently available repository automation surface does not provide a verified Pages settings/deployment action. Pages is supplemental rather than required for RC acceptance because the authoritative CLI/TypeScript verifier is fully reproducible from the repository.

No deployed URL is invented.

## Branch / ruleset / signing decision
At entry, `main` is unprotected and historical commits are unsigned. Phase 8 does not rewrite history to add signatures.

The current automation surface provides read access to branch/ruleset state but no supported branch-protection/ruleset write action and no GitHub-release creation action. Therefore:
- no protection state is fabricated;
- no signed-tag/release state is fabricated;
- forward hardening is carried into the explicit publication closure action;
- RC acceptance can proceed under the existing exact-candidate-CI + non-forced-main-promotion discipline, with this debt visible.

## Dependency / maintenance boundary
The hardened dependency graph retains `@hiero-ledger/sdk` 2.87.0 with `protobufjs` 8.6.6 and `ws` 8.21.0 overrides. `crypto-js@4.2.0` remains an unmaintained transitive dependency and is disclosed as maintenance debt. A zero-finding `npm audit` result is advisory-database evidence only, not complete-security proof.

## Exact-candidate gate
Before PASS, the exact final candidate must successfully execute:

```bash
npm ci
npm audit
npm run typecheck
npm test
npm run verify:public -- local
npm run verify:public -- network
```

Required outcomes:
- locked install PASS;
- npm advisory audit PASS;
- typecheck PASS;
- deterministic suite 100% PASS;
- local verifier independently replays policy for all three cases;
- all six published Hedera testnet anchors return `ANCHORED` from fresh public Mirror reads;
- candidate is promoted to main with `force=false` only after exact-SHA success.

## Security / claim gate
RC metadata intentionally contains public facts only. No live key, `.env` value, private evidence, customer/personal data, or confidential invention note belongs in the release surface.

No claim is authorized for semantic truth, guaranteed correctness, complete security, legal compliance/certification, Hedera endorsement, broad first-ever novelty, or production readiness.

## Publication status
No GitHub tag/release is created or claimed by this candidate commit. No Pages deployment is claimed. Therefore even after exact candidate acceptance, if these publication actions remain external to the current execution surface, `GO_PUBLIC` must transition only to an explicit `HOLD_PUBLICATION_ACTION_REQUIRED`, not silently to public-release complete.

## Validation evidence
Pending exact candidate GitHub Actions run.

## GO_PUBLIC
HOLD pending exact-candidate validation and publication adjudication.

## Next after PASS
If RC acceptance succeeds but release/tag/Pages/protection actions remain unevidenced, execute a dedicated `AIW-Ω8R — PUBLIC RELEASE / GO_PUBLIC CLOSURE` before Phase 9.

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
