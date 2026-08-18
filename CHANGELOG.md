# Changelog

## v1.1.0 — Trusted verification records

- Require independently verified DSSE/Ed25519 receipts by default.
- Bind passing CI results to the exact submitted source and pytest contract.
- Add permanent content-addressed receipt identifiers and retrieval URLs.
- Publish signing-key lifecycle states for rotation, retirement, and revocation.
- Add a public offline verifier with `VALID`, `INVALID`, and `UNTRUSTED` outcomes.
- Reject tampered payloads, unknown or revoked keys, and source/test digest mismatches.
- Add a tamper-evident receipt transparency chain.
- Expose receipt ID, URL, and authentication mode as Action outputs.
- Publish a successful live signed-gate proof using synthetic code and a disposable masked key.
- Preserve source, test, credential, and signing-key privacy.

## v1.0.0

- Initial production GitHub Action.
- Mandatory pytest contracts.
- HTTP 402 enforcement.
- Workspace and symlink escape protection.
- Gateway credential protections.
- Secret masking tests.
- Node 24 runtime.
