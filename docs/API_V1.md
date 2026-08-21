# Causal Verification API v1 Contract

Status: MVP compatibility contract  
Base URL: `https://causal-engine-gateway.fly.dev`

This document defines the public behavior relied on by Causal Verify GitHub Action v1. It does not promise undocumented fields or internal implementation details.

## Authentication

Authenticated endpoints require:

```http
Authorization: Bearer cek_...
```

Treat API keys as secrets. Never commit them, print them in logs, place them in source files, or send them through email or chat. The GitHub Action accepts the key through the `api-key` input and should receive it from a protected GitHub Actions environment secret. Use one unique, limited key per accepted repository and rotate it after suspected exposure.

## Content Type

Requests with JSON bodies use:

```http
Content-Type: application/json
```

## Key provisioning during the controlled beta

Self-service signup and registration are paused. The public free proof requires no
account or API key from the tester. For an accepted controlled pilot, the operator
privately provisions a unique, limited key after confirming the non-sensitive
source and execution scope. Do not build clients against undocumented signup or
key-recovery behavior.

## Verify Python code

```http
POST /v1/verify
Authorization: Bearer cek_...
Content-Type: application/json
```

Request:

```json
{
  "target_path": "solution.py",
  "source_code": "def add(a, b):\n    return a + b\n",
  "test_code": "from solution import add\n\ndef test_add():\n    assert add(2, 3) == 5\n"
}
```

Contract requirements:

- `target_path` names the submitted Python source file.
- `source_code` contains Python source.
- `test_code` contains a pytest verification contract.
- A syntactically valid program without a meaningful pytest contract is not sufficient.
- Clients must treat non-2xx responses as verification failures.
- Clients must not log submitted source or tests by default.

### Passing responses

The v1 Action accepts either current or legacy response shapes.

Current shape:

```json
{
  "status": "pass",
  "passed": true,
  "credits_remaining": 19
}
```

Legacy shape:

```json
{
  "cycle_result": {
    "status": "SETTLED"
  }
}
```

A verification passes only when the response explicitly reports `passed: true`, `status: "pass"`, or legacy `cycle_result.status: "SETTLED"`.

### Failing responses

A test or verification failure may use a current `fail` status or legacy `FAILED` status. Clients must fail closed for unknown, missing, or malformed status values.

## HTTP behavior

| HTTP status | Meaning | Required client behavior |
| --- | --- | --- |
| 2xx | Request processed | Inspect the response status; do not assume pass from HTTP alone |
| 400 | Invalid request | Fail and correct the request |
| 401 or 403 | Authentication or authorization failure | Fail without printing the key |
| 402 | Credits exhausted | Fail; use a returned checkout URL only after validating it |
| 429 | Rate limited, when enabled | Fail or retry with bounded backoff |
| 5xx | Gateway or execution failure | Fail; retry only when safe |

The Action exposes normalized outputs for `passed`, `status`, `credits-remaining`, `request-id`, `http-status`, `ast-valid`, and `error-type` when the gateway supplies the underlying values.

## Compatibility rules

Within v1:

- Existing required request fields will not be renamed or removed.
- Passing and failing meanings will not be reversed.
- New optional response fields may be added.
- Clients must ignore unknown response fields.
- Clients must fail closed on unknown status values.
- Security fixes may tighten URL, path, or credential validation without a major version change.

## Security boundaries

The service receives the complete contents of the selected source and pytest files. During the controlled beta, submit only public or synthetic non-sensitive files. Do not submit credentials, personal or regulated data, private customer code, production-connected tests, or arbitrary contributor code. The public documentation does not currently state a retention/deletion guarantee or SLA. Use only the official gateway unless you intentionally trust another configured endpoint with the submitted files. The Action blocks configured source and test paths from escaping `GITHUB_WORKSPACE` and rejects gateway URLs containing embedded credentials.

## Versioning

The API base path is `/v1`. Controlled pilots must pin Causal Verify Action v1.1.0 to the full immutable commit `zensteagarden/causal-verifier-action@1a7c4f6e21f4218e78b6311b4df6811ae8790148`. Do not use a mutable tag for a trusted beta run.
