# AIW-Ω2 — Deterministic Receipt Core

**PHASE:** AIW-Ω2  
**Status:** PASS  
**Start commit:** `6778c964ecd53237da8d619da13bd2b5d5fb4aba`  
**Final commit:** SELF — the commit containing this report; the canonical SHA is recorded in the Drive handoff after publication to `main`.  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## Files created / modified

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `.github/workflows/ci.yml`
- `src/protocol/types.ts`
- `src/protocol/canonicalize.ts`
- `src/protocol/hash.ts`
- `src/protocol/create-receipt.ts`
- `src/protocol/validate.ts`
- `src/protocol/nonce-registry.ts`
- `src/protocol/chain.ts`
- `src/protocol/redact.ts`
- `tests/protocol/receipt-core.test.ts`
- `reports/02-receipt-core.md`

No Phase-1 specification file was changed.

## Dependencies

The implementation deliberately keeps the dependency surface small:

- Node.js 22 execution profile;
- TypeScript `5.8.3`;
- `@types/node` `22.15.17`;
- npm lockfile version 3.

The deterministic receipt implementation itself uses Node built-ins and does not require an external canonicalization, crypto, database, model, Hedera, or network package.

## Canonicalization implementation choice

IRP-1 schemaVersion 1 validates a deliberately constrained I-JSON-compatible runtime value domain before serialization. Unsupported JavaScript/runtime values fail closed. The canonicalizer then applies the RFC 8785/JCS ordering and ECMAScript JSON serialization behavior required for the frozen accepted subset.

The implementation rejects, among other unsupported inputs:

- `undefined`;
- `NaN` and infinities;
- functions, symbols, and bigint values;
- cyclic and sparse structures;
- custom array properties;
- unpaired UTF-16 surrogates;
- accessor/non-enumerable object members;
- `Date`, arbitrary binary/typed-array objects, and class instances that have not been explicitly normalized.

This is a JCS-compatible implementation for the frozen IRP-1 accepted subset. It is not a claim that arbitrary JavaScript object graphs are valid JCS inputs.

## RFC 8785 / JCS evidence

**PASS.** A fixed RFC 8785/JCS compatibility vector covering object ordering, representative number serialization, escaping, Unicode, and literals is included in the deterministic test battery.

## Receipt hash model

The implementation preserves the Phase-1 frozen model:

- protocol: `IRP-1`;
- schemaVersion: `1`;
- exact W0/W1/W2/W3 kinds;
- exact receipt-kind domain separators;
- structured canonical hash preimage;
- `receiptHash` excluded from its own preimage;
- UTF-8 encoded canonical bytes;
- SHA-256 lowercase hexadecimal output.

## Replay and chain model

Implemented checks include:

- replay-domain nonce uniqueness;
- receipt-ID uniqueness;
- exact W0→W1→W2→W3 ordering;
- cryptographic parent linkage;
- W2→W1 semantic parent linkage;
- W3→W2 semantic parent linkage;
- same-session continuity;
- non-decreasing local receipt time;
- complete-chain stage presence;
- fork detection;
- receipt mutation detection.

## Structural authorization consistency

Phase 2 does not implement policy rules. It does enforce already-frozen structural protocol invariants carried by receipt state:

- `BLOCK` cannot become `AUTHORIZED`;
- `ESCALATE` cannot silently become `AUTHORIZED`;
- required approval not already approved cannot become `AUTHORIZED`;
- execution without W2 `AUTHORIZED` is surfaced as `UNAUTHORIZED_EXECUTION`;
- a `DIVERGED` W3 may coexist with a cryptographically intact chain and is surfaced separately as `ACTION_DIVERGENCE`.

## Redaction / minimization

The public-field helper is explicit allow-list based and fails closed. It does not hash hidden fields, log hidden values, or perform network/Hedera operations.

Hashing sensitive material is not treated as anonymization.

## Commands and reproducible workflow

Canonical gate:

```text
npm ci
npm run typecheck
npm test
```

A pre-publication GitHub Actions validation of the Phase-2 core completed successfully in run `33657320359` on the validation branch. The same gate is committed as `.github/workflows/ci.yml` and is required to pass for the exact final commit before `main` publication and again on `main`.

## Typecheck result

**PASS** in the pre-publication validation workflow.

## Test result

**PASS — 32 passed, 0 failed.**

The battery includes all 29 mandatory Phase-2 behaviors plus replay-registry, explicit disclosure-selection, and frozen-domain-separator checks.

## Security findings

- no credentials, private keys, `.env` values, personal/customer data, or private invention material were added in the Phase-2 public surface;
- locked dependency installation completed successfully;
- the validation workflow reported `0 vulnerabilities` for the installed dependency set;
- no Hedera submission occurs in this phase.

## Claim-boundary findings

No Phase-2 implementation surface claims semantic truth, complete security, legal compliance, Hedera endorsement, production readiness, public-proof completion, or testnet anchoring.

## Known limitations

- signatures / actor identity authentication are not implemented;
- persistent replay storage is not implemented;
- the Phase-3 deterministic policy engine is not implemented;
- demonstration executors/cases are not implemented;
- Hedera HCS / Mirror Node integration is not implemented;
- public verifier is not implemented;
- correspondence comparison logic remains profile-specific beyond structural recording and divergence surfacing;
- local timestamps do not establish objective public chronology.

## Hedera evidence

**NOT_APPLICABLE / NONE.** Phase 2 contains no testnet claim and no topic, sequence number, consensus timestamp, or anchor result.

## Blockers

None at the Phase-2 implementation boundary, subject to successful CI verification of the exact publication commit.

## Next authorized phase

`AIW-Ω3 — DETERMINISTIC POLICY ENGINE`

Phase 3 is not executed by this commit.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
