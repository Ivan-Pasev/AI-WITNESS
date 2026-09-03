# IRP-1 v0.1.0-rc.1 — Release Candidate Checklist

Permanent boundary: **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**.

## Identity

- [x] Technical identity remains IRP-1 / schemaVersion 1.
- [x] RC identity is `v0.1.0-rc.1`.
- [x] RC identity is explicitly separate from private/unpublished npm package metadata.
- [x] No production-readiness claim.

## Public proof inventory

- [x] Frozen public specification present.
- [x] Deterministic receipt core present.
- [x] Deterministic policy engine and public policy present.
- [x] Three public action-correspondence cases present.
- [x] Reviewed Hedera testnet evidence index present.
- [x] Independent TypeScript verifier present.
- [x] Browser inspection surface labeled as weaker where applicable.
- [x] Security/claim/standards audit present.
- [x] Machine-readable RC manifest present.

## Exact-candidate validation

Candidate `5fcd1a68f40eb3088036ec277b79fbd1a1ddb951` was exercised by GitHub Actions run `33765093095`, job `100680792248`:

- [x] `npm ci`
- [x] `npm audit` — 0 vulnerabilities reported by the current advisory database
- [x] `npm run typecheck`
- [x] `npm test` — 157 PASS / 0 FAIL
- [x] `npm run verify:public -- local`
- [x] `npm run verify:public -- network`
- [x] all six published Hedera anchors independently returned `ANCHORED`

The final closure commit containing this completed checklist must itself pass the same exact-SHA gate before non-forced promotion to `main`.

## Security / privacy / claims

- [x] No live credentials are intentionally included in RC metadata.
- [x] No `.env` values are included.
- [x] No customer/personal data or private invention evidence is included.
- [x] HCS evidence remains minimized commitments only.
- [x] No semantic-truth, complete-security, legal-compliance, Hedera-endorsement, broad first-ever, or production-readiness claim.
- [x] `crypto-js@4.2.0` unmaintained-transitive-dependency debt remains disclosed rather than hidden.

## Publication and provenance

- [x] Historical commit history is not rewritten to add signatures.
- [x] No signed-release claim is made without cryptographic evidence.
- [x] Main branch protection state is disclosed rather than assumed.
- [x] GitHub Pages is `DEFERRED_NOT_DEPLOYED`; no URL is fabricated.
- [x] No GitHub tag/release is implied by RC metadata alone.
- [x] A distinct publication action is required before GO_PUBLIC can be closed.

## RC acceptance

The Phase-8 RC engineering gate is accepted subject to exact closure-commit revalidation. Publication is intentionally separate.

**GO_PUBLIC: HOLD_PUBLICATION_ACTION_REQUIRED**
