# AIW-Ω7 — Security / Claim / Standards Audit

## Phase
AIW-Ω7 — SECURITY / CLAIM / STANDARDS AUDIT

## Status
CANDIDATE — PASS requires exact-commit CI, all deterministic tests, independent local policy replay, and six live Hedera Mirror rechecks before non-forced main promotion.

## Entry boundary
`8fb29e510f8621022ebf77be22de7ec32a857e0d` — Phase-6 closure.

Permanent boundary: **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**.

## Security and privacy findings
- No live Hedera operator key, topic submit key, `.env` value, customer/personal data, or confidential invention material is required in the public verifier path.
- The manual Hedera evidence workflow remains `workflow_dispatch` only and read-only for repository contents; no pull-request trigger receives Hedera secrets.
- Public HCS evidence remains limited to protocol, schemaVersion, receiptId, receiptKind, receiptHash, previousReceiptHash, and publicManifestHash.
- Synthetic secret markers in demo fixtures are intentionally obvious and are not live credentials.
- Hashing is not treated as anonymization.
- Main branch protection is not currently enabled. This is bounded release-hardening debt; exact-candidate CI plus non-forced promotion remains the current project evidence discipline. Phase 8 should adjudicate branch/ruleset hardening.
- Historical commits are unsigned. Signing was not a Phase-0–6 invariant; Phase 8 should adjudicate signing/tag provenance for release artifacts without rewriting history.

## Verifier hardening
Phase 6 exposed recorded policy state but did not independently rerun it in the local verifier. This audit closes that gap:
- local verification now requires public policy material to derive ALLOW/BLOCK/ESCALATE independently;
- policy hash, aggregate verdict, and rule-level results must equal the committed W2 evidence;
- absent, mutated, malformed, or mismatching policy material fails closed to `POLICY_UNKNOWN` with explicit issues;
- authorization output is restricted to the frozen protocol authorization vocabulary rather than accepting arbitrary strings;
- Phase-5 network evidence must contain exactly the three canonical cases before aggregate consensus can be evaluated;
- the CLI exits non-zero if the live network result is anything other than `ANCHORED`.

The adversarial verifier suite covers intact ALLOW, BLOCK/no-execution, DIVERGED, missing policy, policy mutation, stale receipt hash, broken parent, missing receipts, exact six-anchor cardinality, all-six anchor verification, timestamp mismatch, topic mismatch, sequence mismatch, malformed Mirror payload, malformed network identity, incomplete case evidence, and the permanent claim boundary.

## Dependency and workflow findings
- `@hiero-ledger/sdk` remains pinned to 2.87.0; the previously hardened `protobufjs` 8.6.6 and `ws` 8.21.0 overrides remain unchanged.
- `crypto-js@4.2.0` remains a transitive SDK dependency and is reported by npm as deprecated/unmaintained. It is tracked as maintenance debt; it is not represented as vulnerability-free beyond the current npm advisory database result.
- GitHub Actions runtime debt is repaired: `actions/checkout` is upgraded from v4 to v7 and `actions/setup-node` from v4 to v7 while the application runtime remains Node 22.
- The secret-bearing manual Hedera workflow disables package-manager caching, reducing unnecessary cache exposure in that job.
- CI verification-ref routing is generalized to `aiw-omega*-final-verify-*`, removing the accumulating hard-coded temporary-branch list.

## Claim audit
No public surface is authorized to claim semantic truth, guaranteed correctness, complete security, legal compliance/certification, Hedera endorsement, broad first-ever novelty, or production readiness.

The README is replaced with a bounded third-party reproduction path and the permanent semantic-truth boundary. `tamper-evident` or related language remains evidence-specific rather than absolute.

## Standards / prior-art freshness
Primary-source refresh for Phase 7 confirms that broad action-receipt novelty remains indefensible and interoperability remains the correct posture.

Important current SCITT context:
- RFC 9943, *Architecture for Trustworthy and Transparent Digital Supply Chains*, is now a Proposed Standard RFC (June 2026), so SCITT is no longer described only as draft architecture work.
- active SCITT/related Internet-Drafts continue around AI-agent action receipts, agent action capsules, pre-execution authorization/permit records, provenance/protected-object binding, composite evidence, refusal events, and newer reconciliation/authorization profiles.
- those Internet-Drafts remain works in progress unless separately advanced.
- IRP-1 does not claim invention of generic signed receipts or cryptographic pre-execution authorization binding.

Current differentiation remains bounded to the integrated W0→W1→W2→W3 action-correspondence model, deterministic policy replay, explicit approval ordering, separated verifier verdicts, and Hedera-native pre/post evidence profile.

Hedera Agent Kit v4 remains the preferred post-public-proof integration substrate; its current official architecture exposes modular plugins, deterministic policies, and four tool lifecycle hook stages suitable for later integration.

## Evidence consistency
Phase-7 CI must reproduce:
1. locked dependency install and npm advisory audit;
2. TypeScript typecheck;
3. all protocol/policy/demo/Hedera/verifier deterministic tests;
4. local verifier with independent policy replay for all three public cases;
5. six credential-free live Mirror Node checks against topic `0.0.10345032`.

A Mirror or network failure is a failed gate, not evidence of anchoring.

## Release surface
The repository README now gives the bounded reproduction chain:

`clone → npm ci → npm audit → typecheck → tests → local policy-replay verifier → live Mirror verifier`

A polished/deployed GitHub Pages verifier, release tag, release manifest, branch/ruleset hardening, and final GO_PUBLIC adjudication remain Phase 8 work. No deployed verifier URL is claimed by Phase 7.

## Known limitations
- receipt digests do not authenticate issuer/approver real-world identity;
- a compromised observation/execution host can fabricate what it claims to observe;
- the deterministic demo secret scanner is not comprehensive secret detection;
- npm audit is advisory-database evidence, not complete security proof;
- public Mirror availability is an external dependency for fresh network verification;
- the browser surface remains weaker than the TypeScript verifier and must not be described as equivalent;
- no current claim establishes semantic truth, complete safety/security, compliance, endorsement, or production readiness.

## GO_PUBLIC
HOLD. Phase 7 can authorize Phase 8 only after this exact audit tree passes its full CI/live-evidence gate and main is advanced non-forced to that same verified tree.

## Next authorized phase after PASS
AIW-Ω8 — PUBLIC RELEASE CANDIDATE

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
