# AIW-Ω3 — Deterministic Policy Engine

**PHASE:** AIW-Ω3  
**Status:** PASS under the self-verifying publication rule below  
**Start commit:** `a554dc7d44e38d7fc5327c3a8eb70550258047b0`  
**Final commit:** SELF — the commit containing this report. The canonical SHA and exact successful GitHub Actions run are recorded in the canonical Drive handoff after the verified commit is fast-forwarded to `main`.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## Publication self-verification rule

This report is valid as PASS only when the exact commit containing it has passed the committed Node 22 `npm ci`, `npm run typecheck`, and `npm test` gate on a temporary verification ref, and public `main` has then advanced to that exact commit by a non-forced fast-forward. If either condition is absent, Phase 3 is HOLD regardless of this file's text.

## Files created / modified

Created:

- `src/policy/types.ts`
- `src/policy/aggregate.ts`
- `src/policy/evaluate.ts`
- `src/policy/load-policy.ts`
- `policies/github-demo-policy.json`
- `tests/policy/policy-engine.test.ts`
- `reports/03-policy-engine.md`

Modified:

- `package.json` — the deterministic test gate now includes protocol and policy suites.
- `.github/workflows/ci.yml` — retains Node 22 / locked install / typecheck / deterministic tests and adds the Phase-3 verification ref.

No Phase-1 specification file or Phase-2 protocol implementation file was changed.

## Policy schema

The public policy is versioned with exactly three top-level fields: `policyId`, `version`, and `rules`. Five rule classes are supported:

- `PATH_ALLOWLIST`
- `PATH_DENYLIST`
- `SECRET_SCAN`
- `CHANGE_COUNT`
- `HUMAN_APPROVAL`

Unknown fields are rejected. Fields containing override/bypass semantics are rejected explicitly. Unknown rule types, duplicate rule IDs, malformed configurations, unsupported values, and invalid path patterns fail closed during policy loading.

## Policy hash rule

Policy hashing reuses the Phase-2 accepted-value validation and canonicalization surface and freezes the distinct domain string:

`IRP1:POLICY`

The preimage is the canonical object `{ domain: "IRP1:POLICY", policy }`. SHA-256 over canonical UTF-8 yields lowercase hexadecimal `policyHash`. Receipt-kind domain separators are not reused.

## Path semantics

Paths are repository-relative and `/`-separated. Empty paths, absolute paths, backslashes, empty path segments, `.` segments, and `..` segments fail closed.

Patterns are deliberately bounded rather than implementing a broad glob language:

- exact `X` matches only `X`;
- `X/**` matches `X` and descendants;
- the narrow `X.*` form exists only to support the frozen `.env.*` deny family and matches non-empty suffixes after `X.`.

A denylist match fails even when an allowlist also passes.

## Secret-scan limitations

`SECRET_SCAN` is a deterministic demonstration heuristic. It checks only a frozen set of obvious synthetic/prohibited markers such as private-key headers, `DEMO_SECRET`, and `SYNTHETIC_PRIVATE_KEY`. Missing scan material produces `UNKNOWN`.

A `PASS` from this rule does **not** prove the absence of every secret and must not be represented as comprehensive secret detection.

## Approval semantics

For a required approval rule:

- `REQUIRED_APPROVED` → `PASS`
- `REQUIRED_PENDING` → `UNKNOWN`
- `REQUIRED_REJECTED` → `FAIL`
- `INVALID` → `FAIL`
- missing / `NOT_REQUIRED` while the policy requires approval → `UNKNOWN`

If the policy rule has `required: false`, the rule returns `PASS`.

The rule evaluates recorded approval state only. It does not authenticate real-world approver identity.

## Aggregation semantics

Rule results are exactly `PASS`, `FAIL`, and `UNKNOWN`.

Aggregate verdicts are exactly `ALLOW`, `BLOCK`, and `ESCALATE`, with frozen precedence:

```text
if any FAIL:       BLOCK
else if UNKNOWN:   ESCALATE
else:              ALLOW
```

Aggregation is independent of rule ordering.

## Tests

The Phase-3 suite defines all 37 mandatory policy behaviors. The existing 32 Phase-2 protocol tests are retained, so the expected combined deterministic battery is **69 tests**.

The exact final test count/result is proven by the self-commit CI run referenced from the canonical Drive handoff; this document does not fabricate a run identifier before that run exists.

## Reproducible CI gate

```text
npm ci
npm run typecheck
npm test
```

The exact final commit must pass this gate before `main` publication.

## Security findings

- no real credentials, private keys, `.env` values, customer/personal data, or private invention material belong in the Phase-3 public surface;
- no network calls or Hedera operations are implemented;
- secret examples are explicitly synthetic markers;
- no administrator override/bypass field is accepted.

Automated Phase-7 repository-wide secret scanning has not yet run and is not claimed here.

## Claim-boundary findings

Phase 3 does not establish semantic truth, comprehensive secret detection, complete security, real-world approver identity, legal/regulatory compliance, Hedera endorsement, end-to-end public proof, or production readiness.

## Hedera evidence

**NOT_APPLICABLE / NONE.** No testnet topic, sequence number, consensus timestamp, or anchor is claimed in Phase 3.

## Blockers

None if and only if the self-verifying publication rule at the top of this report is satisfied.

## Next authorized phase

`AIW-Ω4 — THREE DETERMINISTIC LOCAL PROOF CASES`

Do not execute Phase 4 in the Phase-3 closure cycle.
