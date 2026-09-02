# IRP-1 Privacy Model

**Protocol:** IRP-1  
**Schema version:** 1  
**Status:** SPECIFIED  

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**

## 1. Purpose

IRP-1 uses public commitments to make receipt state inspectable, but public verifiability MUST NOT become a reason to publish sensitive payloads.

The privacy model is based on **minimization**, **explicit public/private separation**, and the rule that consensus is a commitment layer rather than a sensitive-data storage layer.

## 2. Core privacy principles

### P1 — Public consensus is a commitment layer

Hedera Consensus Service MAY carry minimized receipt commitments in the Hedera profile.

HCS MUST NOT be treated as storage for raw sensitive evidence.

### P2 — Public receipts and bundles are minimized

Public evidence bundles MUST contain only material needed for the bounded public verification task.

Public receipts SHOULD use explicit references, redaction declarations, and public manifests rather than copying unnecessary private source material.

### P3 — Private evidence remains off public consensus

Private evidence, confidential source content, confidential policy internals, and unpublished invention material MUST NOT be placed on HCS in the public proof.

### P4 — Secrets never enter public bundles

Credentials, private keys, seed phrases, tokens, passwords, `.env` values, and equivalent secrets MUST NOT appear in public receipts, public bundles, Git history, public logs, or HCS payloads.

### P5 — Personal/customer data is excluded from the public proof

The v0.1 public proof MUST NOT use production customer data.

Personal or customer data MUST NOT be placed on HCS merely to improve apparent auditability.

### P6 — Public and private manifests are distinct

A profile MAY maintain a private evidence manifest and a deliberately minimized public manifest.

The public manifest MUST contain only disclosure-safe verification material.

A public manifest hash MUST NOT be interpreted as proof that the private manifest is complete or truthful.

### P7 — Hashes are not automatically anonymous

Hashing a value does not automatically make the value safe to publish.

Low-entropy or predictable sensitive values may be recoverable through dictionary or brute-force attacks.

Therefore:

> **Hashing sensitive data is not equivalent to making it safe for public disclosure.**

### P8 — Low-entropy sensitive values require stronger treatment

Low-entropy secrets or identifiers MUST NOT be made public merely by publishing their unsalted digest.

A profile that needs commitment to sensitive material SHOULD use a disclosure-aware construction appropriate to its threat model rather than assuming bare hashing provides confidentiality.

IRP-1 v1 does not standardize a universal confidential-commitment scheme.

## 3. Public receipt boundary

A public IRP-1 receipt MAY include:

- protocol/schema identity;
- receipt identifiers;
- stage identity;
- receipt digests and parent hashes;
- public policy identifiers/versions/hashes where safe;
- public rule outcomes;
- approval state without unnecessary personal information;
- public action manifests designed for disclosure;
- public evidence references/digests designed for disclosure;
- correspondence verdicts;
- redaction declarations;
- residual unknowns suitable for disclosure.

A public receipt MUST NOT include data merely because it is available to the agent.

## 4. Private evidence boundary

Private evidence MAY include material that supports local or institutional verification but is unsuitable for public disclosure.

Examples include:

- proprietary source files;
- confidential patches;
- internal documents;
- private prompts or context;
- confidential policy internals;
- personal or customer data;
- unpublished partner/pilot evidence;
- private invention material.

Private evidence MUST remain outside the public Git/HCS surfaces unless separately reviewed and deliberately redacted for disclosure.

## 5. Hedera anchor minimization

The Hedera public-proof profile SHOULD anchor only minimized commitment data such as:

```json
{
  "protocol": "IRP-1",
  "schemaVersion": "1",
  "receiptId": "...",
  "receiptKind": "...",
  "receiptHash": "...",
  "previousReceiptHash": null,
  "publicManifestHash": "..."
}
```

The following MUST NOT be anchored in the public proof:

- raw prompts;
- source files;
- full private patches;
- personal data;
- customer data;
- private evidence;
- private keys;
- credentials;
- confidential policy internals;
- confidential invention notes.

## 6. Redaction semantics

Redaction is an explicit protocol fact, not an assertion that the hidden material is benign.

W0 SHOULD disclose the existence of relevant redactions where doing so is itself safe.

Public bundles SHOULD distinguish:

- material intentionally disclosed;
- material intentionally redacted;
- material not observed;
- material unknown.

A verifier MUST NOT infer that redacted material validates the public claim.

## 7. Evidence manifests

A public evidence manifest SHOULD identify verification-relevant public artifacts without exposing unnecessary content.

A private evidence manifest MAY retain richer references under the operator’s confidential evidence controls.

Where both exist:

```text
private evidence manifest
        |
        | disclosure/minimization process
        v
public evidence manifest
        |
        | canonicalization + digest
        v
publicManifestHash
```

The transformation from private to public material is a disclosure decision, not a cryptographic proof of completeness.

## 8. Approval privacy

Approval records SHOULD use the minimum identity information needed by the profile.

A plain-text approver name or identifier is not real-world identity proof.

If stronger identity is required, the profile SHOULD rely on an external authenticated identity/signature mechanism and SHOULD avoid publishing unnecessary personal attributes.

## 9. Logs and reproducibility

Reproducible verification SHOULD use synthetic or deliberately disclosure-safe fixtures wherever possible.

The public proof MUST NOT require production secrets or customer data.

GitHub Actions logs, local logs, verifier diagnostics, and exported evidence reports MUST be treated as potential disclosure surfaces.

Later security automation SHOULD scan for accidental secret/public-boundary violations before release.

## 10. Synthetic secret test data

The public BLOCK demonstration MAY use obviously synthetic secret markers to exercise deterministic secret-scan behavior.

Synthetic markers MUST be clearly non-credential test data and MUST NOT resemble or contain live secrets.

## 11. Retention and deletion

IRP-1 v1 does not define a universal retention schedule.

Operators remain responsible for applying appropriate retention/deletion rules to private evidence stores.

Public HCS commitments may be effectively durable; this strengthens the requirement to minimize public anchor content before submission.

## 12. Privacy non-goals

IRP-1 does not claim to provide:

- universal anonymity;
- confidential computing;
- zero-knowledge disclosure by default;
- protection against all correlation attacks;
- automatic GDPR or other regulatory compliance;
- automatic secret classification;
- automatic data minimization without profile/operator design.

## 13. Public-proof privacy gate

Before public proof release, the project MUST verify at least:

- no private keys in Git;
- no `.env` committed;
- no live credentials in fixtures or logs;
- no production customer data in demonstrations;
- no private evidence on HCS;
- no personal/customer data on HCS;
- public bundles deliberately minimized;
- synthetic secret markers clearly synthetic;
- claim language does not imply hashing equals anonymization.

## 14. Permanent claim boundary

Privacy minimization preserves disclosure boundaries. It does not prove the remaining public content semantically true.

> **SEMANTIC TRUTH: NOT PROVEN BY IRP-1**
