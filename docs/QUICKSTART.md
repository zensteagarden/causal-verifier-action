# Controlled Beta Quickstart

This guide installs the Causal Verify Action after an operator-run Noticer outcome proof has been accepted for a managed pilot.

The free proof itself requires only:

1. a public GitHub repository URL
2. one sentence: **"when ______ happens, ______ must be true."**

[Open a free outcome-proof request](https://github.com/zensteagarden/causal-verifier-action/issues/new?template=free-outcome-proof.yml).

Do not post API keys, source code, credentials, personal information, or security reports in the public issue.

## Before You Install

An accepted installed pilot requires:

- a GitHub repository
- permission to add repository secrets and workflow files
- one selected Python source file
- one pytest outcome contract
- a `cek_` API key privately provisioned by the operator

Self-service email signup is paused during the controlled beta. The key is delivered privately only after the proof and installation scope are accepted.

## 1. Add the Secret

Create a repository secret named:

```text
CAUSAL_ENGINE_API_KEY
```

Set its value to the complete `cek_` key. Do not commit it or send it through chat.

Create a repository variable named `NOTICER_CONTRACT_SHA256` and set it to the
lowercase SHA-256 of the approved outcome contract:

```bash
sha256sum test_solution.py
```

## 2. Add Source and an Outcome Contract

Select one Python source file and one pytest file that asserts the required behavior.

Example `solution.py`:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Example `test_solution.py`:

```python
from solution import add


def test_add():
    assert add(2, 3) == 5
```

## 3. Add the Workflow

Create `.github/workflows/noticer-outcome-gate.yml`:

```yaml
name: Noticer Outcome Gate

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
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: zensteagarden/causal-verifier-action@778604721c055ef5bf2384e56717895d26366a38
        with:
          api-key: ${{ secrets.CAUSAL_ENGINE_API_KEY }}
          source-path: solution.py
          test-path: test_solution.py
          expected-test-sha256: ${{ vars.NOTICER_CONTRACT_SHA256 }}
```

The immutable Action commit above contains the v1.2 decision-consistency and
contract-pin security fixes.

## 4. Run It

Open a pull request or manually dispatch the workflow. A passing job requires a valid signed receipt bound to the selected source and outcome contract. A failing contract, malformed response, HTTP error, timeout, exhausted balance, unsafe path, or unsafe gateway URL fails the job.

A repository owner may make the Noticer Outcome Gate a required status check after validating the pilot.

## Troubleshooting

### Missing API Key

Confirm the secret is named exactly `CAUSAL_ENGINE_API_KEY` and the workflow passes it through `secrets.CAUSAL_ENGINE_API_KEY`. Never print the secret.

### Missing Outcome Contract

The `test-path` input is required. Point it to a real pytest file that asserts the declared behavior.

### HTTP 402

The account has no remaining verification balance. Contact the operator through the accepted pilot thread. Do not use an unverified checkout link.

### Path Rejected

Both source and test files must resolve inside `GITHUB_WORKSPACE`. Symlinks and traversal paths that escape the workspace are rejected.

### Safe Support Information

Share only the Action version, HTTP status, normalized status, error type, and request ID. Do not share API keys, raw authorization headers, proprietary source, or complete unredacted responses.
