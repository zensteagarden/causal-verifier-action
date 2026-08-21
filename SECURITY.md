# Security and Support

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository owner privately through GitHub's security reporting channel when enabled. Include the smallest reproducible example and omit live credentials, customer source, and personal data.

If private vulnerability reporting is not available, do not publish exploit details. Ask the owner for a private reporting channel first.

## Credential safety

- Store a unique, limited `cek_` key only in a password manager, protected local secret store, or protected GitHub Actions environment secret.
- Never place keys in workflow YAML, source files, issue comments, screenshots, terminal transcripts, or chat.
- Never send a Windows, GitHub, email, or payment password to the gateway.
- Rotate a key immediately if it may have been exposed.
- The Action masks recognized `cek_` values, but masking is a last defense rather than permission to print a key.

## Source confidentiality

Verification sends the complete contents of the selected source and pytest files to the configured gateway. During the controlled beta, submit only public or synthetic non-sensitive files. Do not submit credentials, personal or regulated data, private customer code, production-connected tests, or arbitrary contributor code. The public documentation does not currently state a retention/deletion guarantee or SLA. Do not configure a third-party gateway URL unless you intentionally trust it with the submitted files.

## Untrusted workflow boundary

Use an owner-approved manual workflow run for the controlled beta. Do not expose
the key to arbitrary contributor branches, external forks, or Dependabot changes.
GitHub intentionally withholds ordinary Actions secrets from fork and Dependabot
pull requests. Never switch to `pull_request_target`, `workflow_run`, or another
privileged workaround that checks out or executes untrusted code with the key
available. Protect the workflow and outcome contract from unauthorized changes.

## Safe diagnostics

Support requests should contain only:

- Action version
- HTTP status
- normalized verification status
- error type
- request ID, when returned
- whether the run used the official gateway

Do not attach raw response bodies until they have been reviewed and redacted. Do not attach proprietary source unless a private support process explicitly requires it.

## Supported controlled-beta release

Pin Causal Verify Action v1.1.0 to the full immutable commit `zensteagarden/causal-verifier-action@1a7c4f6e21f4218e78b6311b4df6811ae8790148`. Do not use a mutable tag for a trusted beta run.

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
