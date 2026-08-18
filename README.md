# Causal Verify GitHub Action

A GitHub Action for the Causal Verification Gate.

It sends generated Python source and pytest tests to `POST /v1/verify`, then fails CI unless the verification gate passes.

Live gateway: `https://causal-engine-gateway.fly.dev`

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

## 5-Minute Setup

### 1. Create a Free API Key

```bash
curl -sS https://causal-engine-gateway.fly.dev/v1/accounts/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Copy the returned `api_key`. It should start with `cek_`.

### 2. Add the GitHub Secret

In your repository settings, add:

```text
CAUSAL_ENGINE_API_KEY=cek_your_key_here
```

### 3. Add a Workflow

Create `.github/workflows/causal-verify.yml`:

```yaml
name: Causal Verification Gate

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:

jobs:
  verify:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: zensteagarden/causal-verifier-action@v1
        with:
          api-key: ${{ secrets.CAUSAL_ENGINE_API_KEY }}
          source-path: solution.py
          test-path: test_solution.py
```

If `source-path` is omitted on a pull request, the action verifies the first added or modified `.py` file against `origin/<base_ref>`. `test-path` is always required so a passing result proves behavior, not merely valid syntax.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `api-key` | yes | | `cek_` key from `POST /v1/accounts/signup` or `/v1/accounts/register`. |
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

- Store API keys only in GitHub Secrets.
- The action masks `cek_` keys in logs.
- Submitted source code and tests are sent to the configured verification gateway but are not printed in CI logs by default.
- Do not use this action for repositories containing secrets in source files.
- Do not point `gateway-url` at a third-party URL unless you intentionally trust that service with submitted source and tests.
- The action blocks configured file paths from escaping `GITHUB_WORKSPACE`.

## HTTP 402

When credits are exhausted, the engine returns HTTP 402. This action fails the job and writes `checkout-url` when the API provides one.


## Documentation

- [Five-minute quickstart](docs/QUICKSTART.md)
- [API v1 compatibility contract](docs/API_V1.md)
- [Security and safe support](SECURITY.md)
- [MVP launch readiness](docs/LAUNCH_READINESS.md)
