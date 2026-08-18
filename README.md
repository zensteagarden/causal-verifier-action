# Causal Verify GitHub Action

A GitHub Action for the Causal Verification Gate.

It sends generated Python source and pytest tests to `POST /v1/verify`, then fails CI unless the verification gate passes.

Live gateway: `https://causal-engine-gateway.fly.dev`

## What It Does

Your coding agent says the code works. This action checks whether it actually passes the verification contract.

The action:

- reads a Python source file
- reads a pytest file, or generates a parse-only test when none is provided
- calls the metered verification API
- passes CI only when the API returns a passing result
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

If `source-path` is omitted on a pull request, the action verifies the first added or modified `.py` file against `origin/<base_ref>`.

## Inputs

| Name | Required | Default | Description |
| --- | --- | --- | --- |
| `api-key` | yes | | `cek_` key from `POST /v1/accounts/signup` or `/v1/accounts/register`. |
| `gateway-url` | no | `https://causal-engine-gateway.fly.dev` | Gateway base URL. |
| `source-path` | no | first changed `.py` on PR | Python file to verify. |
| `test-path` | no | generated parse-only contract | Pytest file to run. |
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

## Response Compatibility

The action supports both the current legacy engine response and the simple MVP response described in the developer launch handoff.

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
