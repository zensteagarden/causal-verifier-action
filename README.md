# Causal Verify GitHub Action

A GitHub Action for the Causal Verification Gate.

It sends generated Python source and pytest tests to `POST /v1/verify`, then fails CI unless the verification gate passes.

Live gateway: `https://causal-engine-gateway.fly.dev`

**Category:** trusted verification records for AI-generated software.

Version 1.1 requires an issuer-authenticated receipt, independently verifies its signature, and binds it to the exact local source and pytest contract before CI can pass.


## Try One Outcome Proof Free

I am accepting the first five eligible public Python repositories.

Send only:

- the public GitHub repository URL
- one sentence: **"when ______ happens, ______ must be true."**

I will run the repository's current checks and Noticer side by side, then return the public evidence. The free proof is operator-run: no email signup, credits, API key, private code, or production access is required from the tester.

[Open a free outcome-proof request](https://github.com/zensteagarden/causal-verifier-action/issues/new?template=free-outcome-proof.yml)

This is a controlled technical proof, not a promise that the repository contains a bug. Eligible requests must be reproducible safely from public code.

## Live Signed Verification Receipt

[View the public issuer-authenticated Causal receipt](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32189632078).

That successful live run returned and independently verified a DSSE/Ed25519 envelope containing:

- an in-toto Statement v1;
- the official `https://in-toto.io/attestation/test-result/v0.1` predicate;
- the SHA-256 digest of the exact synthetic Python source;
- the SHA-256 digest of the exact synthetic pytest contract;
- the mechanical result `PASSED`;
- a signature matching the gateway's published Ed25519 verification key.

The public workflow reconstructed DSSE pre-authentication encoding and verified the signature independently with Node's cryptographic library. Its final result is `DSSE signature: VALID`. The receipt contains no submitted source, tests, API credential, or private signing material.


## Verify a Receipt Offline

Save a gateway response as `receipt.json`, then run:

```bash
node verify-receipt.js --receipt receipt.json
```

The verifier fetches only the gateway's public Ed25519 keyset. For a completely disconnected check, save that keyset and pass `--keys keys.json`. Add `--source solution.py --tests test_solution.py` to prove that local files match the signed digests.

It prints `VALID`, `INVALID`, or `UNTRUSTED` and exits nonzero unless the DSSE signature, statement shape, key trust status, and any supplied file digests verify.

## What It Does

Your coding agent says the code works. This action checks whether it actually passes the verification contract.

The action:

- reads a Python source file
- reads a required pytest verification contract
- calls the metered verification API
- passes CI only when the API returns a passing result and a valid DSSE/Ed25519 receipt
- independently binds the signed receipt to the submitted source and tests
- fails CI on test failure, HTTP errors, timeouts, and HTTP 402 credit exhaustion
- masks `cek_` API keys in logs
- does not print submitted source or tests by default
- blocks configured source and test paths from escaping the GitHub workspace

## Accepted Controlled Pilot Installation

Read the [complete First User Manual](docs/FIRST_USER_MANUAL.md) before
installing. The current safe installed scope is an owner-approved manual run in
a trusted repository using public or synthetic non-sensitive files. Do not submit
proprietary customer code, credentials, personal or regulated data,
production-connected tests, or arbitrary contributor code during this beta.

Self-service email signup is paused. The operator privately provisions one unique,
limited `cek_` key for an accepted repository.

### 1. Add the protected environment secret

Create a GitHub Actions environment named `noticer-beta`, add a required
reviewer when supported, and add this environment secret:

```text
CAUSAL_ENGINE_API_KEY
```

The repository owner should paste the privately delivered value. Never commit,
email, chat, screenshot, or print the real key.

### 2. Add the manual workflow

Create `.github/workflows/noticer-outcome-gate.yml`:

```yaml
name: Noticer Outcome Gate

on:
  workflow_dispatch:

concurrency:
  group: noticer-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  verify:
    name: Noticer Outcome Gate
    runs-on: ubuntu-latest
    environment: noticer-beta
    timeout-minutes: 5
    steps:
      - name: Check out repository
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1
        with:
          persist-credentials: false

      - name: Check required result
        uses: zensteagarden/causal-verifier-action@1a7c4f6e21f4218e78b6311b4df6811ae8790148
        with:
          api-key: ${{ secrets.CAUSAL_ENGINE_API_KEY }}
          source-path: solution.py
          test-path: test_solution.py
          require-signed-receipt: "true"
          timeout-seconds: "120"
```

The immutable Action commit above is the v1.1.0 release. Replace the two example
paths with one explicit source file and one explicit pytest outcome contract.
The Action submits the complete contents of those two files.

### 3. Run it manually

After the owner reviews and merges the manual-only workflow onto the default
branch, open **Actions → Noticer Outcome Gate → Run workflow** and choose an
owner-approved ref. Never use `pull_request_target`, `workflow_run`, or another
privileged workaround to expose the key while checking out or executing untrusted
code. Do not make the current beta workflow a required merge check.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `api-key` | yes | | `cek_` key privately provisioned for an accepted pilot. |
| `gateway-url` | no | `https://causal-engine-gateway.fly.dev` | Gateway base URL. |
| `source-path` | no | first changed `.py` on PR | Python file to verify. |
| `test-path` | yes | | Pytest file defining the verification contract. |
| `require-signed-receipt` | no | `true` | Reject missing, invalid, unknown-key, or revoked-key receipts. |
| `timeout-seconds` | no | `120` | Client-side request timeout, 5-600 seconds. |

## Outputs

| Name | Description |
| --- | --- |
| `passed` | `true` when verification passed. |
| `status` | `pass`, `fail`, `SETTLED`, `FAILED`, `PAYMENT_REQUIRED`, or `HTTP_ERROR`. |
| `cycle-status` | Backward-compatible alias for `status`. |
| `endpoint-id` | Endpoint id or content hash when returned. |
| `checkout-url` | Stripe Checkout URL on HTTP 402 when returned. |
| `credits-remaining` | Remaining credits when returned. |
| `request-id` | Request id when returned. |
| `http-status` | HTTP status from `/v1/verify`. |
| `ast-valid` | AST validity signal when returned. |
| `error-type` | Machine-readable error type when returned. |
| `receipt-id` | Content-addressed receipt identifier. |
| `receipt-url` | Permanent receipt lookup URL. |
| `receipt-authentication` | Receipt authentication mode. |

## Response Compatibility

Passing jobs require a valid signed receipt by default. Legacy or private gateways can be tested temporarily with `require-signed-receipt: false`, but that removes issuer authentication and should not be used as a trusted merge gate.

Legacy response:

```json
{
  "cycle_result": {
    "status": "SETTLED"
  }
}
```

MVP response:

```json
{
  "status": "pass",
  "passed": true,
  "credits_remaining": 19
}
```

## Source and Secret Protection

- Use a unique, limited key in a protected GitHub Actions environment secret.
- The Action masks recognized `cek_` values, but masking is only a last defense against accidental log disclosure.
- The complete selected source and pytest files are sent to the configured verification gateway but are not printed in CI logs by default.
- During the beta, submit only public or synthetic non-sensitive files; the public documentation does not currently state a retention/deletion guarantee or SLA.
- Never submit credentials, personal or regulated data, private customer code, production-connected tests, or arbitrary contributor code.
- Do not point `gateway-url` at a third-party URL unless you intentionally trust that service with the submitted files.
- The Action blocks configured file paths from escaping `GITHUB_WORKSPACE`.
- Protect the workflow and outcome contract from unauthorized changes.

## HTTP 402

When credits are exhausted, the engine returns HTTP 402. This action fails the job and writes `checkout-url` when the API provides one.


## License and Ownership Boundary

The MIT license applies to the software contained in this repository. It does not grant rights to the NOTICER name or to separately hosted service code, private verifier implementations, signing private keys, customer evidence, proprietary outcome-contract methods, or other material not included here. See [NOTICE.md](NOTICE.md).

## Documentation

- [Complete First User Manual](docs/FIRST_USER_MANUAL.md)
- [Controlled beta and trial rules](docs/CONTROLLED_BETA.md)
- [Accepted pilot quickstart](docs/QUICKSTART.md)
- [API v1 compatibility contract](docs/API_V1.md)
- [Security and safe support](SECURITY.md)
- [MVP launch readiness](docs/LAUNCH_READINESS.md)
- [Trust model and proof](docs/TRUST_MODEL.md)
- [Changelog](CHANGELOG.md)
