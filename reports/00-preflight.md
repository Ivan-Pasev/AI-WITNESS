# AI WITNESS / IRP-1 — Repository Preflight

## Phase

PHASE_0 — REPOSITORY PREFLIGHT

Status at this commit: REMOTE INITIALIZATION COMPLETE; local checkout re-synchronization still required before later engineering phases are treated as locally/remote-equal.

## Repository Identity

- Repository: `Ivan-Pasev/AI-WITNESS`
- Public URL: `https://github.com/Ivan-Pasev/AI-WITNESS`
- Visibility: public
- Default branch: `main`
- Starting public commit before this initialization: `dfc4796c6b4d81a5744991ada0b1568b8e945043` (`Initial commit`)
- Connected GitHub permission at initialization: admin, with push/maintain/pull capability

## Local Engineering Root

Expected dedicated local engineering checkout:

`C:\gilc.us.mesh.repos\AI-WITNESS-IRP1`

A historically misbound similarly named checkout pointed to another repository and must not be repurposed.

## Local Toolchain — Last Observed

The last reported dedicated local recovery session observed:

- Node.js: `v20.19.3`
- npm: `10.8.2`
- Git: `2.43.0`

These values are historical local evidence and MUST be rechecked before implementation work resumes.

## Git Identity

Repository-local Git identity was reported configured in the dedicated recovery checkout. This public report intentionally does not expose the configured email address.

## Public / Private Boundary

Public repository material MAY include:

- protocol specification;
- reference implementation;
- tests and deterministic vectors;
- redacted public demonstration bundles;
- Hedera testnet commitment evidence;
- verifier code;
- public reports and documentation.

The following MUST NOT be committed:

- `internal/` invention and confidential working material;
- `.env` or environment-specific secret files;
- private keys, seed phrases, credentials, API tokens, or signing material;
- `receipts/private/`;
- raw private prompts or private evidence;
- customer or personal data used as confidential evidence.

`.env.example` is intentionally allowed so configuration shape can be documented without secrets.

## Security Baseline

This commit establishes a Node-oriented `.gitignore`, an explicit private `internal/` boundary, a private receipt boundary, environment/credential exclusions, editor/OS exclusions, and Apache License 2.0.

No secret material is intentionally included in this commit.

## Claim Boundary

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

IRP-1 is intended to make bounded receipt integrity, authorization ordering, policy-path disclosure, consensus anchoring evidence, and action correspondence independently inspectable when the corresponding implementation gates pass.

IRP-1 does not prove that an AI interpretation is true, that reasoning is correct, that an action is ethical, that a system is legally compliant, or that the system is completely secure.

## History Reconciliation Note

An earlier local-only Phase 0 commit was reported from the dedicated recovery clone but was never observed on public `main`. Because authenticated GitHub connector access is now confirmed, this atomic public initialization commit becomes the canonical remote Phase 0 root.

The unpublished local-only commit must be preserved as a local archive reference if it still exists, then the dedicated local `main` must be re-synchronized to canonical `origin/main` before Phase 0 is declared fully closed across local and remote surfaces.

Do not force-push either history.

## Next Gate

Before AIW-Ω0.5 or protocol implementation:

1. fetch canonical `origin/main` into the dedicated local checkout;
2. preserve the unpublished local Phase 0 commit on a local archive branch if it still exists;
3. align local `main` to canonical `origin/main` without changing public history;
4. verify the worktree is clean and local `HEAD == origin/main`;
5. record that equality in the canonical Engineering Evidence & Handoff document.

Only then may `PHASE_0: PASS` be asserted.
