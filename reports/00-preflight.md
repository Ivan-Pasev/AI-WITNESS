# AI WITNESS / IRP-1 — Repository Preflight

## Phase

PHASE_0 — REPOSITORY PREFLIGHT

Status: **PASS**

The canonical engineering surface is the public GitHub repository. A local checkout is optional for convenience and is not a prerequisite for protocol specification, implementation, testing, CI, or deployment.

## Repository Identity

- Repository: `Ivan-Pasev/AI-WITNESS`
- Public URL: `https://github.com/Ivan-Pasev/AI-WITNESS`
- Visibility: public
- Default branch: `main`
- Original genesis commit: `dfc4796c6b4d81a5744991ada0b1568b8e945043` (`Initial commit`)
- Canonical Phase 0 initialization commit: `f6275de8769862686aa491307d3098076491a1d7`
- Connected GitHub permission: admin, with push/maintain/pull capability

## Canonical Development Workflow

The project uses a cloud-native development path:

1. GitHub `main` is authoritative for source code, tests, protocol files, CI, releases, and deployable public artifacts.
2. Google Drive `AI_WITNESS_IRP1_CANONICAL_WORKING_TREE` is authoritative for the Master Manuscript, White Paper, Hedera ecosystem grant pack, prior-art/positioning register, and human-readable engineering handoff.
3. Implementation changes may be authored directly through authenticated GitHub access.
4. GitHub Actions should become the reproducible execution surface for typechecking, tests, security/claim scans, evidence generation, and release gates.
5. GitHub Pages should host the static public verifier when Phase 6 is reached.
6. Hedera testnet and Mirror Node provide the external consensus-evidence surface in Phase 5.
7. A local checkout remains optional for offline work or additional independent verification, but cloud-native progress MUST NOT depend on a particular workstation.

This removes the earlier temporary local/remote-equality prerequisite. The unpublished historical local Phase 0 commit, if it still exists on a workstation, is non-canonical and must never be force-pushed over public `main`.

## Public / Private Boundary

Public repository material MAY include:

- protocol specification;
- reference implementation;
- tests and deterministic vectors;
- redacted public demonstration bundles;
- Hedera testnet commitment evidence;
- verifier code;
- CI/release configuration;
- public reports and documentation.

The following MUST NOT be committed:

- `internal/` invention and confidential working material;
- `.env` or environment-specific secret files;
- private keys, seed phrases, credentials, API tokens, or signing material;
- `receipts/private/`;
- raw private prompts or private evidence;
- customer or personal data used as confidential evidence.

`.env.example` is intentionally allowed so configuration shape can be documented without secrets.

## Secret Handling

GitHub connector access is sufficient for repository code and documentation changes, but secret-management endpoints are intentionally not part of the normal connected surface. When Hedera testnet credentials are required, they must be configured through an approved GitHub Actions secret or equivalent protected environment mechanism without copying secrets into chat, Drive, source files, logs, or public evidence bundles.

## Security Baseline

The repository establishes a Node-oriented `.gitignore`, an explicit private `internal/` boundary, a private receipt boundary, environment/credential exclusions, editor/OS exclusions, and Apache License 2.0.

No secret material is intentionally included in Phase 0.

## Claim Boundary

**SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

IRP-1 is intended to make bounded receipt integrity, authorization ordering, policy-path disclosure, consensus anchoring evidence, and action correspondence independently inspectable when the corresponding implementation gates pass.

IRP-1 does not prove that an AI interpretation is true, that reasoning is correct, that an action is ethical, that a system is legally compliant, or that the system is completely secure.

## Phase 0 Verdict

- repository identity: PASS
- public `main`: PASS
- authenticated GitHub write access: PASS
- Apache-2.0 license: PASS
- secure `.gitignore`: PASS
- preflight report: PASS
- private-path boundary: PASS
- local workstation dependency: NONE

`PHASE_0: PASS`

## Next Authorized Gate

`AIW-Ω0.5 — OPPORTUNITY / PRIOR-ART / POSITIONING FREEZE`

Phase 0.5 should be performed directly against current external sources, synchronized into the canonical Google Drive prior-art/positioning register, and then reflected into the public repository before protocol implementation proceeds.
