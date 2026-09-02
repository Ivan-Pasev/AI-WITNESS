# Reproduce BLOCK_AND_NOT_EXECUTED

This bundle is deterministic Phase-4 local/public evidence only. It contains **no Hedera consensus proof**.

From the repository root:

1. Install the locked dependency set with `npm ci`.
2. Run `npm run typecheck`.
3. Run `npm test`.
4. The demo test suite rebuilds `block-and-not-executed` from the committed synthetic fixture state.
5. It recomputes every W0/W1/W2/W3 receipt hash with the IRP-1 receipt core.
6. It validates the complete W0→W1→W2→W3 chain.
7. It reruns `github-demo-policy` and compares the policy hash, rule results, and aggregate verdict.
8. It deterministically compares the authorized and actual action manifests.
9. The expected final correspondence verdict is `NOT_EXECUTED`.

The fixture timestamps, receipt IDs, and nonces are explicitly synthetic deterministic values. They are not Hedera consensus timestamps or external-event identifiers.

`SEMANTIC TRUTH: NOT PROVEN BY IRP-1`
