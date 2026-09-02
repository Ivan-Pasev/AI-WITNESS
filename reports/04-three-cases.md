# AIW-Ω4 — Three Deterministic Local Proof Cases

## Phase

`AIW-Ω4 — THREE DETERMINISTIC LOCAL PROOF CASES`

Status: **PASS only after the exact commit containing this report passes the canonical GitHub Actions gate and is promoted to `main` without force.**

Start commit:

`88976c7f4080b3ae04fab5c61b39786d22e9275b`

Target commit subject:

`test(demo): add allowed blocked and divergent receipt cases`

The GitHub Actions run identifier is assigned only after the immutable candidate commit exists. The canonical Google Drive Engineering Evidence & Handoff records the exact run ID after validation. This repository report does not fabricate a future run identifier.

## Implemented proof surface

Phase 4 adds deterministic, network-free, model-free synthetic execution cases over the already frozen IRP-1 receipt core and policy engine.

### Case A — ALLOW_AND_MATCH

Expected and implemented verdicts:

- chain: `CHAIN_VALID`
- policy: `ALLOW`
- approval: `REQUIRED_AND_APPROVED`
- authorization: `AUTHORIZED`
- execution: `EXECUTED`
- correspondence: `MATCH`

The exact executor mutates only `demo/target.md` in isolated in-memory demo state. The actual action manifest equals the authorized action manifest.

### Case B — BLOCK_AND_NOT_EXECUTED

Expected and implemented verdicts:

- chain: `CHAIN_VALID`
- policy: `BLOCK`
- approval: `REQUIRED_AND_APPROVED`
- authorization: `BLOCKED`
- execution: `NOT_EXECUTED`
- correspondence: `NOT_EXECUTED`

The request targets `demo/protected/immutable.txt` and includes the obvious synthetic marker `SYNTHETIC_PRIVATE_KEY`. The denylist and synthetic-secret rules fail deterministically. The blocked executor performs zero mutation.

No real private key, token, credential, seed phrase, customer data, or personal secret is used.

### Case C — ALLOW_BUT_DIVERGED

Expected and implemented verdicts:

- chain: `CHAIN_VALID`
- policy: `ALLOW`
- approval: `REQUIRED_AND_APPROVED`
- authorization: `AUTHORIZED`
- execution: `EXECUTED`
- correspondence: `DIVERGED`

W2 authorizes exactly one append to `demo/target.md`. The controlled adversarial executor performs that authorized append and one additional synthetic append to `demo/adversarial-extra.md`.

The additional mutation is intentionally **not** inserted retroactively into W2. W2 remains cryptographically intact while W3 records `DIVERGED` and identifies `demo/adversarial-extra.md` as the unauthorized extra path.

This demonstrates the intended separation:

`CHAIN_VALID ∧ AUTHORIZED ∧ EXECUTED` does not imply `MATCH`.

## Deterministic generation model

All case timestamps, receipt IDs, nonces, fixture text, action text, and proposal text are fixed synthetic values.

The demo:

- performs no network access;
- uses no live model;
- requires no local workstation identity;
- uses no random UUIDs;
- uses no current-time clock;
- mutates only isolated in-memory synthetic state during tests;
- leaves committed fixture files unchanged.

Action correspondence compares deterministic operation, target-path set, change count, change digest, and before/after file hashes.

## Public bundle inventory

Each of the three folders under `receipts/public/` contains:

- `W0.json`
- `W1.json`
- `W2.json`
- `W3.json`
- `policy-evaluation.json`
- `manifest.json`
- `expected-verdict.json`
- `REPRODUCE.md`

The committed bundles contain real deterministic receipt hashes and the real deterministic `github-demo-policy` hash:

`3a93fb8cb92a325379f3f3b154693af076cb1ec509e467fe357b54cb108208c0`

They contain no Hedera topic ID, sequence number, transaction ID, consensus timestamp, account ID, grant identifier, endorsement, or other fabricated external evidence.

## Test contract

Phase 4 adds 50 named deterministic demo tests while retaining all 32 protocol tests and all 37 policy tests.

Expected exact test inventory after successful canonical CI:

- protocol tests: 32
- policy tests: 37
- demo tests: 50
- total: 119

The canonical gate remains:

- `npm ci`
- `npm run typecheck`
- `npm test`

The exact candidate must pass this gate before `main` advances.

## Security and privacy findings

The public proof uses synthetic repository fixtures only.

`receipts/private/` remains ignored and is not part of the Phase-4 public tree.

No Hedera credentials, `.env` values, real private-key material, personal/customer data, private invention material, or raw model chain-of-thought is intentionally introduced.

The synthetic secret scanner remains a bounded demonstration heuristic. A scanner `PASS` does not prove universal absence of secrets.

## Claim boundary

Phase 4 establishes deterministic local/public action-correspondence evidence only.

It does **not** establish:

- semantic truth;
- AI reasoning correctness;
- complete security;
- legal or regulatory compliance;
- actor identity;
- Hedera endorsement;
- Hedera consensus anchoring;
- production readiness;
- `PUBLIC_PROOF` maturity.

`SEMANTIC TRUTH: NOT PROVEN BY IRP-1`

## Hedera evidence

`NOT_APPLICABLE / NONE`

Phase 4 intentionally creates no Hedera SDK files, testnet topic, sequence number, consensus timestamp, Mirror Node evidence, or anchor claim.

## Known limitations

- Demo execution is synthetic and deterministic rather than a live agent execution.
- Approval identity is recorded state, not independently authenticated identity.
- The policy secret scan is intentionally bounded.
- Correspondence is defined over the frozen Phase-4 file-action manifest, not arbitrary real-world side effects.
- Host-compromise and evidence-omission limitations from the Phase-1 threat model remain.

## Next authorized phase

Only after exact-commit CI validation and non-forced publication:

`AIW-Ω5 — HEDERA TESTNET ANCHORING`

`GO_PUBLIC: HOLD`
