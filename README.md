# AI WITNESS / IRP-1

AI WITNESS is the public reference implementation of **IRP-1**, a bounded action-correspondence protocol for AI-agent operations.

IRP-1 separates what a system declared it observed and intended from what policy/approval authorized and what was later observed to have happened:

`W0 Observation → W1 Intent → W2 Authorization → W3 Outcome`

The current public proof includes deterministic receipt hashing and chain validation, deterministic policy replay, three adversarial action-correspondence cases, genuine Hedera testnet W2/W3 anchors, Mirror Node verification, and an independent multidimensional verifier.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

IRP-1 does **not** prove that an AI interpretation was true, that reasoning was correct, that an action was ethical or legally compliant, that a host was uncompromised, or that the implementation is completely secure.

## Reproduce the public proof

Requirements: Node.js 22 and npm.

```bash
npm ci
npm audit
npm run typecheck
npm test
npm run verify:public -- local
npm run verify:public -- network
```

`verify:public -- local` independently recomputes receipt integrity/chain state and reruns the committed public policy against the declared W2 inputs. `verify:public -- network` performs credential-free reads against the official Hedera testnet Mirror Node and requires all six published W2/W3 anchors to match topic, sequence, consensus timestamp, canonical payload, receipt hash, and public-manifest hash.

The network check depends on current public Mirror Node availability; a network error is never upgraded to `ANCHORED`.

## Public proof cases

| Case | Policy / authorization | Outcome |
|---|---|---|
| `ALLOW_AND_MATCH` | ALLOW / AUTHORIZED | MATCH |
| `BLOCK_AND_NOT_EXECUTED` | BLOCK / BLOCKED | NOT_EXECUTED |
| `ALLOW_BUT_DIVERGED` | ALLOW / AUTHORIZED | DIVERGED |

The third case demonstrates the intended separation: a cryptographically valid receipt chain and valid pre-action authorization do not imply faithful execution.

## Hedera evidence

The current Phase-5 public-proof topic is Hedera testnet topic `0.0.10345032`. The reviewed machine-readable evidence is committed at `receipts/public/hedera-testnet/index.json`.

HCS receives only minimized public commitment fields: protocol, schema version, receipt ID/kind, receipt hash, previous receipt hash, and public-manifest hash. Credentials, raw prompts, full patches, private evidence, and personal/customer data are excluded by design.

## Verifier dimensions

The verifier does not emit a single trust score. It reports independent dimensions for receipt integrity, chain, consensus, policy, approval, authorization, and correspondence.

See:

- `specification/IRP-1.md`
- `specification/CLAIM-BOUNDARY.md`
- `reports/04-three-cases.md`
- `reports/05-hedera-testnet.md`
- `reports/06-public-verifier.md`
- `reports/07-security-claims-standards-audit.md`

## Status

Phases 0–6 are closed by reproducible evidence. Phase 7 is the pre-release security/claim/standards audit. **GO_PUBLIC remains HOLD until the release-candidate gate is separately adjudicated.**

Apache-2.0 licensed.
