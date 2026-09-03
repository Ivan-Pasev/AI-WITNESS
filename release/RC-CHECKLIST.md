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

The following are mandatory on the exact accepted candidate and remain **PENDING** until the external GitHub Actions run is recorded in `reports/08-public-release-candidate.md`:

- [ ] `npm ci`
- [ ] `npm audit`
- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run verify:public -- local`
- [ ] `npm run verify:public -- network`
- [ ] deterministic suite 100% pass
- [ ] all six published Hedera anchors independently return `ANCHORED`
- [ ] exact candidate promoted to `main` without force

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
- [x] GitHub Pages is `DEFERRED_NOT_DEPLOYED` unless a real deployment is separately evidenced.
- [x] No Pages URL is fabricated.
- [x] No GitHub tag/release is implied by RC metadata alone.

## RC acceptance

RC acceptance requires exact-candidate CI plus live public evidence re-verification. Even after RC acceptance, public tag/release/Pages/provenance actions require a distinct evidence-bearing publication step if they cannot be executed and verified in this gate.

**GO_PUBLIC: HOLD until explicitly adjudicated from exact evidence.**
