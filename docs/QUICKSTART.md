# Controlled Beta Quickstart

For the easiest first experience, use the operator-run proof. It needs only:

1. a public Python repository URL
2. one sentence: **“when ______ happens, ______ must be true.”**

[Open a free outcome-proof request](https://github.com/zensteagarden/causal-verifier-action/issues/new?template=free-outcome-proof.yml).

There is no download, account, email signup, credit claim, API key, private code,
or production access required from the tester. Do not post credentials, personal
information, private repository details, or security reports in the public issue.

For the complete explanation, safety boundary, installation steps, result guide,
and troubleshooting, read the [First User Manual](FIRST_USER_MANUAL.md).

## Current safe scope

Use the installed beta only after operator acceptance:

- public or synthetic non-sensitive Python
- one explicit source file plus one explicit pytest contract
- a trusted repository and owner-approved ref
- a unique, limited key privately provisioned for that repository
- an owner-approved manual workflow run

Do not submit proprietary customer code, credentials, personal or regulated data,
production-connected tests, or arbitrary contributor code. Do not make the beta
workflow a required merge check yet.

## 1. Add the protected beta environment

1. Open repository **Settings** → **Environments**.
2. Create an environment named `noticer-beta`.
3. Add a required reviewer and branch restriction when the GitHub plan supports
   those controls.
4. Add the environment secret `CAUSAL_ENGINE_API_KEY`.
5. Paste the privately provisioned value and save it.

The repository owner should add the key. Never commit, email, chat, screenshot,
or print it. Do not reuse it across customers or repositories.

## 2. Select the source and outcome contract

Use explicit repository-relative paths.

Example `solution.py`:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Example `test_solution.py`:

```python
from solution import add


def test_add_returns_the_required_sum():
    assert add(2, 3) == 5
```

The Action submits the complete contents of those two files. It does not submit
supporting modules or dependency manifests. The public documentation does not
currently state a retention/deletion guarantee or SLA.

## 3. Add the manual workflow

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

Both actions use immutable commit pins. Replace the two example paths.

## 4. Run it

`workflow_dispatch` is available after the workflow exists on the default
branch. Have the owner review and merge this manual-only workflow; merging it
does not run Noticer automatically.

1. Open **Actions** → **Noticer Outcome Gate**.
2. Select **Run workflow**.
3. Choose an owner-approved branch containing only the intended non-sensitive
   source and contract.
4. Approve the `noticer-beta` environment when prompted.
5. Open the job and read its final status.

Never use `pull_request_target`, `workflow_run`, or another privileged
workaround to expose the key while checking out or executing untrusted code.

## 5. Understand the verdict

A valid receipt proves that the exact submitted source file passed the exact
submitted pytest contract on the Noticer gateway at that time, and that the
receipt matches the issuer's published signing key and both file digests.

- `PASS`, `pass`, or `SETTLED`: the selected contract passed and the signed
  receipt verified.
- `FAIL`, `fail`, or `FAILED`: the selected contract did not pass.
- HTTP 402 or `PAYMENT_REQUIRED`: balance problem, not a code verdict.
- `HTTP_ERROR`, timeout, 401, 403, or 5xx: operational problem, not necessarily
  a code defect.
- Signed receipt failure: authentication or binding failed; keep the gate closed.

A PASS does not prove that the contract captures intent, the whole repository or
production system worked, no other bug exists, or an independent auditor approved
the system.

## Safe support

Share only the Action pin, GitHub run URL, HTTP status, normalized status, error
type, request ID, receipt ID when returned, and whether the official gateway was
used. Do not share the key, authorization headers, private source, customer data,
or raw unredacted responses.
