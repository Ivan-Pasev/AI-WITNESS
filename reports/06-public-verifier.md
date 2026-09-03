# AIW-Ω6 — Independent Public Verifier

## Phase
AIW-Ω6 — PUBLIC INDEPENDENT VERIFIER

## Status
CANDIDATE — requires exact-commit CI before PASS.

## Scope
This phase adds a public verifier without changing the frozen IRP-1 protocol. Verdict dimensions remain separate:

- receipt integrity;
- chain;
- consensus;
- policy;
- approval;
- authorization;
- correspondence.

No single trust score, truth percentage, compliance certificate, or safety certification is emitted.

## Public evidence input
The genuine Phase-5 GitHub Actions evidence artifact from run `33722221305`, artifact `9881949325`, has been reviewed and copied to:

`receipts/public/hedera-testnet/index.json`

Artifact ZIP digest recorded by GitHub Actions:

`03da0d0c9b4ce29ba20be9e32e0f62cf9646c5e0874d3d31431b2eaa83f127c6`

The evidence records Hedera testnet topic `0.0.10345032`, three cases, and six W2/W3 anchor records.

## Verifier architecture
`src/verifier/verify.ts` provides two bounded verification paths.

### Local receipt bundles
- recompute receipt hashes through the frozen IRP-1 receipt-integrity validator;
- validate complete W0→W1→W2→W3 chain ordering and linkage;
- surface policy, approval, authorization and correspondence as independent dimensions;
- keep consensus as `NOT_CHECKED` unless network evidence is supplied.

### Hedera Phase-5 evidence
- recompute each public-manifest hash;
- reconstruct the exact minimized expected HCS anchor payload;
- independently query the official Hedera testnet Mirror Node by topic and sequence;
- verify topic, sequence, consensus timestamp, canonical payload, receipt hash and public-manifest hash;
- aggregate consensus to `ANCHORED` only when every requested anchor is independently verified.

## Static browser surface
`public/verifier/index.html` accepts pasted/file JSON and exposes the independent verdict dimensions. The browser surface deliberately labels cryptographic receipt hashing and live consensus re-verification as not performed there when it cannot reproduce the repository verifier exactly. It directs users to the repository verifier rather than pretending equivalence.

## Reproduction
```bash
npm ci
npm run typecheck
npm test
npm run verify:public -- local
npm run verify:public -- network
```

The `network` command performs live Mirror Node reads and therefore depends on public testnet availability, but requires no private key.

## Claim boundary
SEMANTIC TRUTH: NOT PROVEN BY IRP-1

The verifier does not prove semantic truth, complete evidence, uncompromised execution environment, actor identity, legal compliance, complete security, or Hedera endorsement.
