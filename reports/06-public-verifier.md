# AIW-Ω6 — Independent Public Verifier

## Phase
AIW-Ω6 — PUBLIC INDEPENDENT VERIFIER

## Status
PASS

Phase 6 is complete when this exact repository tree passes CI and public Mirror re-verification and canonical `main` is advanced non-forced to the verified commit. The external run identifier and canonical SHA are recorded in the engineering handoff because a commit cannot truthfully embed its own final SHA or future Actions run ID.

## Start boundary
Phase-5 canonical commit:

`2ed1dd4024cb9a08aaa0979c105b68701896a7d0`

Genuine Phase-5 evidence source:

- GitHub Actions run `33722221305`;
- successful job attempt `100554550752`;
- artifact `phase5-hedera-evidence`, ID `9881949325`;
- artifact ZIP SHA-256 `03da0d0c9b4ce29ba20be9e32e0f62cf9646c5e0874d3d31431b2eaa83f127c6`;
- Hedera testnet topic `0.0.10345032`;
- three cases and six W2/W3 anchor records.

The reviewed public evidence is copied to `receipts/public/hedera-testnet/index.json` so verification does not depend on private workflow state.

## Scope delivered
This phase adds an independent verifier without changing the frozen IRP-1 protocol. Verdict dimensions remain separate:

- receipt integrity;
- chain;
- consensus;
- policy;
- approval;
- authorization;
- correspondence.

No single trust score, truth percentage, compliance certificate, or safety certification is emitted.

## Verifier architecture
`src/verifier/verify.ts` provides two bounded verification paths.

### Local receipt bundles
- recompute receipt hashes through the frozen IRP-1 receipt-integrity validator;
- validate complete W0→W1→W2→W3 chain ordering and linkage;
- surface policy, approval, authorization and correspondence independently;
- keep consensus as `NOT_CHECKED` unless network evidence is supplied.

### Hedera Phase-5 evidence
- recompute each public-manifest hash;
- reconstruct the exact minimized expected HCS anchor payload;
- independently query the official Hedera testnet Mirror Node by topic and sequence;
- verify topic, sequence, consensus timestamp, canonical payload, receipt hash and public-manifest hash;
- aggregate consensus to `ANCHORED` only when every requested anchor is independently verified.

CI executes `npm run verify:public -- network`, so the Phase-6 gate includes six unauthenticated live public Mirror Node rechecks against the published Phase-5 evidence. No Hedera private key is required by the verifier.

## Static browser surface
`public/verifier/index.html` accepts pasted/file JSON and exposes independent verdict dimensions. The lightweight browser surface deliberately labels cryptographic receipt hashing and live consensus verification as not performed in-browser when it cannot reproduce the repository verifier exactly. It directs users to the TypeScript verifier rather than presenting recorded evidence as a fresh cryptographic/network check.

## Reproduction
```bash
npm ci
npm audit
npm run typecheck
npm test
npm run verify:public -- local
npm run verify:public -- network
```

The `network` command performs public Mirror Node reads and therefore depends on current Hedera testnet Mirror availability, but requires no credentials.

## Evidence requirements satisfied by the Phase-6 closure gate
- locked install passes;
- npm advisory audit passes for the installed graph;
- TypeScript typecheck passes;
- complete deterministic suite passes;
- verifier-specific tests cover intact, modified, missing, valid/block/diverged, six-anchor evidence, timestamp mismatch, and permanent claim boundary cases;
- live Mirror verification returns aggregate `ANCHORED` for all six published Phase-5 anchors;
- canonical main is advanced only to the exact commit that passed those checks.

## Security / privacy
No Hedera operator private key, submit key, `.env` value, private evidence, customer/personal data, or confidential invention material is required or intentionally published by this verifier phase. The public network evidence contains minimized commitment and consensus metadata only.

## Known limitations
- v0.1 receipt digests do not authenticate the real-world identity of an issuer or approver;
- Mirror verification establishes correspondence with Hedera testnet records, not semantic truth;
- the static browser surface is intentionally weaker than the TypeScript verifier and labels that limitation;
- public policy status displayed from W2 is not by itself a new independent policy execution unless the relevant replay surface is invoked;
- Phase 7 repository-wide security, privacy, claim, dependency and standards auditing remains required before GO_PUBLIC.

## Next authorized phase
AIW-Ω7 — SECURITY / CLAIM / STANDARDS AUDIT

GO_PUBLIC remains HOLD.

## Claim boundary
SEMANTIC TRUTH: NOT PROVEN BY IRP-1
