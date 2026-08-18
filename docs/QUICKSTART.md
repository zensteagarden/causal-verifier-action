# Five-Minute Quickstart

This quickstart adds Causal Verify to a Python repository. It uses synthetic code and does not require proprietary source.

## Before you start

You need:

- a GitHub repository
- permission to add repository secrets and workflow files
- a Causal Engine API key beginning with `cek_`

Create a free key if needed:

```bash
curl -sS https://causal-engine-gateway.fly.dev/v1/accounts/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

Copy the returned `api_key` directly into a password manager or GitHub Secret. Do not commit it or send it through chat.

## 1. Add the secret

Create a repository secret named:

```text
CAUSAL_ENGINE_API_KEY
```

Set its value to the complete `cek_` key. GitHub passes the key to the Action without placing it in the workflow file.

## 2. Add sample source and tests

Create `solution.py`:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Create `test_solution.py`:

```python
from solution import add


def test_add():
    assert add(2, 3) == 5
```

## 3. Add the workflow

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

For an immutable dependency pin, replace `@v1` with `@v1.0.0`.

## 4. Run it

Open a pull request or manually dispatch the workflow. A successful run reports a passing status such as `pass` or legacy `SETTLED`. A failing test, malformed response, HTTP error, timeout, exhausted credits, unsafe path, or unsafe gateway URL fails the job.

## Troubleshooting

### Missing API key

Confirm the secret is named exactly `CAUSAL_ENGINE_API_KEY` and the workflow passes it through `secrets.CAUSAL_ENGINE_API_KEY`. Never print the secret to inspect it.

### Missing pytest contract

The `test-path` input is required. Point it to a real pytest file that asserts behavior.

### HTTP 402

The account has no remaining verification credits. Use the checkout URL only if it is supplied by the official gateway and points to a trusted destination.

### Path rejected

Both source and test files must resolve inside `GITHUB_WORKSPACE`. Symlinks and traversal paths that escape the workspace are rejected intentionally.

### Gateway URL rejected

Use `https://causal-engine-gateway.fly.dev`. URLs containing usernames, passwords, or other embedded credentials are rejected.

## Safe support information

When requesting help, share only:

- HTTP status
- normalized status
- error type
- request ID, when returned

Do not share API keys, raw authorization headers, proprietary source, or complete unredacted responses.
