# AIW-Ω5 — Hedera Testnet Anchoring

## Phase

`AIW-Ω5 — HEDERA TESTNET ANCHORING`

Status: **HOLD — deterministic integration surface prepared; genuine network evidence is required before Phase 5 can pass.**

Entry commit:

`c481dc46e89fe31afd893c4654ca8deaa8a7fc15`

Truthful scaffold commit subject:

`feat(hedera): prepare testnet anchoring pipeline`

The closure-only subject `feat(hedera): anchor authorization and outcome receipts on testnet` is reserved for a later commit that contains genuine verified testnet evidence.

## SDK and network profile

- SDK: `@hiero-ledger/sdk`
- exact version: `2.87.0`
- network: `testnet` only
- Mirror Node base: `https://testnet.mirrornode.hedera.com`
- public-manifest hash domain: `IRP1:PUBLIC_MANIFEST`
- anchor payload canonicalization: frozen IRP-1 canonical JSON profile

The implementation uses the current Hiero JavaScript SDK package and the HCS topic transaction surface. No mainnet path is authorized by this phase.

## Dependency security hardening

Dependency introduction was treated as a security gate rather than a package-install detail.

- A raw `@hiero-ledger/sdk@2.87.0` candidate produced npm-audit findings: 1 moderate and 4 high, rooted in vulnerable transitive `protobufjs` and `ws` versions.
- A fallback probe of `@hiero-ledger/sdk@2.81.0` was materially worse and was rejected.
- The project retains current SDK `2.87.0` and pins safe transitive overrides `protobufjs=8.6.6` and `ws=8.21.0`.
- Hardened dependency probe run `33681259158` completed successfully and its captured audit reported zero npm-audit vulnerabilities for that generated graph.
- The canonical CI and secret-bearing Hedera workflow both run `npm audit` after `npm ci`.

A zero-result npm audit is evidence about the audited dependency advisory set; it is not proof of complete software security.

## Candidate validation history

The first scaffold candidate `8313f8c569d06583e824dcd2b8f195163976054f` was **not** promoted. CI run `33680871731` failed TypeScript validation on receipt-kind narrowing in `src/hedera/anchor.ts`. The defect was corrected in a clean replacement candidate built from the Phase-4 canonical parent. Failure evidence remains non-canonical validation history rather than being rewritten away.

## Minimized anchor envelope

Only W2 and W3 are eligible for the Phase-5 public-proof anchor profile. The exact public commitment fields are:

- `protocol`
- `schemaVersion`
- `receiptId`
- `receiptKind`
- `receiptHash`
- `previousReceiptHash`
- `publicManifestHash`

Raw prompts, model reasoning, source files, full patches, private policy/evidence, credentials, customer/personal data, confidential invention notes, and absolute local paths are not part of the HCS payload.

## Chronology model

Phase 5 uses **P5-A — anchored evidence instance**.

Phase-4 deterministic bundles remain unchanged baseline artifacts. A genuine Phase-5 run creates fresh run identifiers and receipt timestamps, anchors W2 and verifies it through the Mirror Node before the execution/block event, then creates and anchors W3 afterward.

This prevents retroactive treatment of Phase-4 synthetic fixture timestamps as consensus chronology.

## Deterministic implementation gate

The scaffold adds:

- strict anchor payload construction and parsing;
- deterministic public-manifest hashing;
- testnet-only client configuration;
- submit-key-controlled topic creation;
- HCS submit plumbing;
- Mirror Node topic/sequence retrieval;
- strict Mirror response parsing;
- independent `ANCHORED`, `NOT_FOUND`, `TOPIC_MISMATCH`, `SEQUENCE_MISMATCH`, `PAYLOAD_MISMATCH`, `HASH_MISMATCH`, `MIRROR_ERROR`, and `NOT_CHECKED` outcomes;
- a manual secret-bearing GitHub Actions workflow with no pull-request trigger;
- a P5-A live evidence runner that writes only public network evidence to `phase5-output/` after successful completion.

The exact replacement-candidate and canonical-main CI run identifiers are recorded after GitHub assigns them. This report does not fabricate future run IDs.

## Genuine network evidence

Public topic ID: **NOT AVAILABLE / NOT CLAIMED**

Case A W2/W3: **NOT_CHECKED**

Case B W2/W3: **NOT_CHECKED**

Case C W2/W3: **NOT_CHECKED**

No `receipts/public/hedera-testnet/index.json` is committed until genuine Mirror-verified values exist.

`TESTNET_ANCHORED`: **NOT ESTABLISHED**

## Current blocker

`HOLD_HEDERA_TESTNET_CREDENTIALS_REQUIRED`

The operator must supply testnet credentials only through protected GitHub Actions secrets or another protected secret mechanism. Credentials must not be pasted into chat, Google Drive, repository files, logs, public bundles, or HCS messages.

Expected protected secret names:

- `HEDERA_OPERATOR_ID`
- `HEDERA_OPERATOR_KEY`
- optionally `HEDERA_TOPIC_ID`
- `HEDERA_TOPIC_SUBMIT_KEY` when an existing topic is supplied

If no topic is supplied, the Phase-5 runner creates a submit-key-controlled testnet topic using protected key material and exposes only the resulting public topic ID in successful evidence.

## Claim boundary

A successful HCS transaction alone is not sufficient. An anchor becomes `ANCHORED` only after Mirror retrieval verifies topic, sequence, consensus timestamp, canonical payload, receipt hash, previous receipt hash, and public-manifest hash.

Consensus evidence does not prove semantic truth, reasoning correctness, legal compliance, complete security, or real-world actor identity.

`SEMANTIC TRUTH: NOT PROVEN BY IRP-1`

## Next phase

`AIW-Ω6 — STATIC PUBLIC VERIFIER` is **NOT AUTHORIZED** while Phase 5 is HOLD.
