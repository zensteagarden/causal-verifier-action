# Security and Support

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository owner privately through GitHub's security reporting channel when enabled. Include the smallest reproducible example and omit live credentials, customer source, and personal data.

If private vulnerability reporting is not available, do not publish exploit details. Ask the owner for a private reporting channel first.

## Credential safety

- Store `cek_` keys only in a password manager, protected local secret store, or GitHub Secrets.
- Never place keys in workflow YAML, source files, issue comments, screenshots, terminal transcripts, or chat.
- Never send a Windows, GitHub, email, or payment password to the gateway.
- Rotate a key immediately if it may have been exposed.
- The Action masks recognized `cek_` values, but masking is a last defense rather than permission to print a key.

## Source confidentiality

Verification sends the selected source and pytest contract to the configured gateway. Do not submit secrets or credentials embedded in source. Do not configure a third-party gateway URL unless you intentionally trust it with the submitted code.

## Safe diagnostics

Support requests should contain only:

- Action version
- HTTP status
- normalized verification status
- error type
- request ID, when returned
- whether the run used the official gateway

Do not attach raw response bodies until they have been reviewed and redacted. Do not attach proprietary source unless a private support process explicitly requires it.

## Supported release

Use `zensteagarden/causal-verifier-action@v1` for automatic compatible v1 security and reliability updates. Use `@v1.0.0` when organizational policy requires an immutable release.

## Expected failure behavior

The Action fails closed on:

- failing pytest contracts
- missing or unknown verification statuses
- malformed responses
- authentication and authorization errors
- exhausted credits
- timeouts and gateway errors
- source or test paths escaping the workspace
- gateway URLs containing embedded credentials

## Operator response checklist

For a suspected credential leak:

1. Revoke or rotate the affected key.
2. Remove the exposed value from logs and public artifacts where possible.
3. Preserve a sanitized incident timeline.
4. Check verification and billing activity for misuse.
5. Document the corrective action without repeating the secret.

For a suspected sandbox escape:

1. Disable or restrict affected verification traffic.
2. Preserve sanitized request identifiers and infrastructure logs.
3. Do not reproduce the exploit against production.
4. Patch and validate in an isolated environment.
5. Publish a security release after confirming containment.
