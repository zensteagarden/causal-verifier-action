# Causal Verify Trust Model

Causal Verify is a mechanical acceptance layer for AI-generated Python. It does not ask an LLM whether code looks correct. It executes submitted source against an explicit pytest contract and returns a signed result.

## What a trusted result proves

A valid receipt proves that:

- the receipt was signed by a published, non-revoked Causal Verify key;
- the receipt binds SHA-256 digests of the exact submitted source and tests;
- the mechanical result was `PASSED` or `FAILED`;
- the receipt has a content-addressed identifier;
- the receipt was committed to the gateway's tamper-evident hash chain.

A receipt does not prove that the supplied tests fully describe the user's intent, that the whole repository/build/deployment or a production side effect worked, that the program has no other defect or vulnerability, that an independent auditor reproduced the result, or that the local transparency log has external witnesses. “Independent verification” in this repository means that the Action cryptographically checks the issuer's signature and file digests; it is not an independent third-party audit.

## Enforcement

The GitHub Action requires signed receipts by default. It independently:

1. retrieves the gateway's public key history without sending the API credential;
2. rejects missing, malformed, unknown-key, or revoked-key receipts;
3. verifies the DSSE/Ed25519 signature;
4. recomputes local source and test digests;
5. fails CI when the signed result is not trusted or not passing.

## Privacy boundary

Public evidence contains hashes, result metadata, receipt identifiers, signatures, public keys, and transparency commitments. It does not contain submitted source, tests, API credentials, private signing material, or internal candidate-generation methods. The gateway does receive the complete selected source and pytest files for execution. During the controlled beta, submit only public or synthetic non-sensitive files; the public documentation does not currently state a retention/deletion guarantee or SLA.

## Human authority

Verification selects technical survivors. It does not approve product intent, merge code, deploy software, weaken tests, or authorize production promotion.

## Live proof

- [Public signed-gate workflow](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32194578660)
- [Receipt lookup](https://causal-engine-gateway.fly.dev/v1/receipts/584e716585172940c3670042c8e6c5bbe58d91181ecedddba01c03795864c6e8)
- Receipt ID: `584e716585172940c3670042c8e6c5bbe58d91181ecedddba01c03795864c6e8`
- Signing key ID: `1d1b1c4b14b13dc9ee152bf918186620644e2d2a52eefadecdf71f72430ad4f8`
