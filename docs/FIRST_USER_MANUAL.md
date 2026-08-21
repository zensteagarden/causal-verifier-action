# Noticer First User Manual

**Try it, install it, and understand the result**  
Version 1.0 · 21 August 2026

Noticer checks one specific result that a Python project must produce. It runs
beside your existing GitHub checks and returns issuer-signed evidence that the
GitHub Action checks against the exact source file and pytest contract selected
for the run.

> **Fastest start:** For the controlled free trial, there is nothing to download
> or install. Give Noticer a public Python repository and one required result.

## 1. What the software is

There are two parts:

1. **Noticer** is the managed outcome-checking service and operator process.
2. **Causal Verify GitHub Action** is the open-source connector that a GitHub
   workflow uses to send one selected Python file and one selected pytest file
   to Noticer and verify the returned signed result.

GitHub Actions runs the automated jobs you configure: builds, linters, unit
tests, packaging, and deployment steps. Noticer answers a narrower question:

> Did this exact version of the selected code produce this explicitly required
> result under the selected test contract?

They are complementary, not interchangeable. Your existing checks cover the
project broadly. Noticer adds an independently verified gate for one result
that matters enough to name.

### What Noticer is not

Noticer is not:

- a replacement for GitHub Actions or your existing tests
- a whole-repository scanner
- an automatic reader of product intent
- a production monitoring system
- proof that an application has no bugs or vulnerabilities
- permission to merge or deploy code

The current controlled beta is deliberately narrow: Python, one selected source
file, and one pytest outcome contract per verification run. Noticer and Causal
Verify are independent products and are not GitHub products or endorsed by
GitHub.

### Current safety boundary

The safe first-user scope today is a controlled demonstration using public or
synthetic, non-sensitive code and an owner-approved manual workflow run. Do not
submit proprietary customer code, credentials, personal or regulated data, or
production-connected tests during this beta.

Automatic required pull-request checks and proprietary-source use should wait
until the customer has reviewed and accepted documented runner isolation,
retention/deletion, operator access, logging, hosting/subprocessor, encryption,
incident-response, availability, and key-management terms. This manual does not
claim that those production controls or an SLA are presently available.

## 2. Choose the easiest path

| Your goal | Best path | What you need |
| --- | --- | --- |
| See the idea work once | **Free operator-run proof** | A public Python repo and one required result |
| Run it yourself in a controlled beta | **Accepted manual pilot** | Operator approval, a trusted repo, a limited key, and two explicit file paths |
| Recheck a saved proof record locally | **Offline receipt verifier** | Node.js 20+, the saved receipt, and optionally the exact source and test files |

The free proof is the recommended first experience. It requires no account,
email signup, credits, API key, private source, or production access from the
tester. As of this manual's date, the offer is limited to the first five
eligible public Python repositories.

## 3. Before you begin: define one required result

Use this sentence:

> **When ______ happens, ______ must be true.**

Good results are narrow, observable, and deterministic:

- When an order is saved, looking it up by its ID must return that order.
- When access is granted, the access check must allow the protected feature.
- When a file save reports success, the expected file must exist with the
  required content.

Avoid broad statements:

- The app works.
- The code is secure.
- All bugs are gone.
- Users are happy.

A useful result names an event and one fact that another program can observe.
Describe **what must happen**, not how the code must be written.

## 4. Path A — try one outcome free, with no installation

### Eligibility

The request is eligible when:

- the repository is public and primarily Python
- you own or maintain it, or have permission to request the proof
- the result can be reproduced without secrets, private data, or production
  access
- the result is narrow enough to express as a pytest test
- you permit the demonstration and its evidence to be public on GitHub

### Submit the request

1. Open the public request form:  
   <https://github.com/zensteagarden/causal-verifier-action/issues/new?template=free-outcome-proof.yml>
2. Paste the public GitHub repository URL.
3. Complete: **When ______ happens, ______ must be true.**
4. Confirm that you have authority to request a public demonstration.
5. Submit the issue.

Do not paste an email address, API key, password, token, private repository
detail, production credential, customer data, payment information, or security
vulnerability into the public issue.

### What happens next

The operator will determine whether the result can be reproduced safely from
public code. If accepted, the operator:

1. identifies the smallest source file and pytest contract needed
2. works only in a public fork or draft pull request
3. runs the repository's existing checks
4. runs Noticer against the exact selected source and frozen contract
5. records the commit, workflow links, contract digest, verdict, and signed
   receipt identifier
6. returns the public evidence in the request thread

Your original repository is not changed, merged, or deployed by the free proof.
If the operator constructs a one-line defect or synthetic fixture, the evidence
must say **CONTROLLED DEMONSTRATION**. It must not be presented as a real defect
discovered in your project.

### What the free proof tells you

| Existing GitHub checks | Noticer | Meaning |
| --- | --- | --- |
| PASS | PASS | Existing checks passed, and the named result was observed. |
| PASS | FAIL | Existing checks passed, but the named result was missing in the Noticer run. |
| FAIL | Not run | The project did not reach the point where Noticer could judge the result. |
| PASS | Could not verify | The proof environment or configuration was incomplete. This is not a code verdict. |

The important demonstration is **existing checks PASS / Noticer FAIL** followed
by a repaired **PASS / PASS**. It shows that two different gates can answer two
different questions. A stronger conventional test might also catch the same
defect; Noticer's additional value is the issuer-signed result, independently
checked by the Action and bound to the selected code and contract. This is not
an independent third-party audit.

## 5. Path B — install the accepted controlled pilot

Use this path only after the operator accepts the controlled pilot and privately
provisions a unique, limited-balance key for that repository. Self-service email
registration is paused during the controlled beta. The safe first run is a
manual dispatch on an owner-approved ref; it is not an automatic gate for
untrusted pull requests.

### Prerequisites

You need:

- permission to add a GitHub Actions secret and workflow file
- a repository in which every person allowed to change the selected source,
  contract, or workflow is trusted for the pilot
- one Python source file
- one pytest file that asserts the required result
- a privately provisioned `cek_…` key
- public or synthetic, non-sensitive source for the beta
- a GitHub-hosted runner that supports the Action's Node.js 24 runtime and can
  reach the official gateway over HTTPS

The repository owner should add the key. Never place the real key in a workflow
file, source file, issue, pull request, email, chat, screenshot, terminal
transcript, or this manual. Deliver it through an agreed one-time secure channel,
do not reuse it across customers or repositories, and rotate it immediately
after suspected exposure. GitHub masking reduces accidental log disclosure; it
does not prevent a trusted workflow editor from deliberately exfiltrating a
secret.

### Step 1 — select the source and outcome test

For the first run, use explicit, repository-relative paths. Do not rely on the
Action's automatic changed-file selection.

Minimal example source, `solution.py`:

```python
def add(a: int, b: int) -> int:
    return a + b
```

Minimal outcome contract, `test_solution.py`:

```python
from solution import add


def test_add_returns_the_required_sum():
    assert add(2, 3) == 5
```

Run the test in your normal project environment first. The installed pilot is
most useful when the contract also covers the nearby failure you actually care
about, such as “save reported success but lookup returned nothing.”

The Action sends only the complete contents of the selected source and test
files. It does not send dependency manifests or supporting modules. A contract
that requires a package tree, third-party dependency, network service, or
production side effect may not run correctly in the current one-file beta.

### Step 2 — add the API key to a protected beta environment

1. Open the accepted pilot repository on GitHub.
2. Select **Settings**.
3. Select **Environments** → **New environment**.
4. Name it `noticer-beta`.
5. When the repository's GitHub plan supports it, add a required reviewer and
   restrict which branches may use the environment.
6. Under the environment's **Environment secrets**, select **Add secret**.
7. Enter this exact name: `CAUSAL_ENGINE_API_KEY`.
8. Paste the complete privately provisioned value and save it.

If the pilot cannot use protected environments, the operator may approve a
repository secret with the same name only for a small repository where all
workflow editors are trusted. Do not use a broad organization secret.

GitHub documentation:  
<https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets>

### Step 3 — add the workflow

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
          fetch-depth: 0
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

Replace `solution.py` and `test_solution.py` with your real repository-relative
paths. Keep `require-signed-receipt` at its secure default of `true`.

The two `uses:` values above are immutable commit pins:

- `actions/checkout` v7.0.1
- Causal Verify Action v1.1.0

This workflow grants only read access to repository contents, tells checkout not
to persist its GitHub credential, cancels duplicate manual runs for the same
ref, and limits the job to five minutes.

### Step 4 — run the workflow

`workflow_dispatch` is available only after the workflow file exists on the
repository's default branch. Have the owner review and merge this manual-only
workflow first; merging it does not run Noticer automatically.

1. Open **Actions** → **Noticer Outcome Gate**.
2. Select **Run workflow**.
3. Choose an owner-approved branch or commit containing only the intended
   non-sensitive source and contract.
4. Approve the `noticer-beta` environment if a required reviewer is configured.
5. Open the run and then the **Noticer Outcome Gate** job.

Do not use this credentialed workflow on arbitrary contributor branches,
external forks, or Dependabot changes. GitHub intentionally withholds ordinary
Actions secrets from fork and Dependabot pull requests. Never switch to
`pull_request_target`, `workflow_run`, or another privileged workaround that
checks out or executes untrusted code with the key available.

### Step 5 — read the result

A green job means all of the following happened for that run:

- the gateway returned a passing result
- the Action verified the DSSE/Ed25519 signature against a published key
- the receipt matched the exact selected source and pytest contract
- the signed mechanical result was passing

A red job can mean either a **code/contract result** or an **operational error**.
Read the final Action log lines before drawing a conclusion.

| Log or status | Interpretation | Next action |
| --- | --- | --- |
| `PASS`, `pass`, or `SETTLED` | The selected contract passed and the signed receipt verified. | Review scope; merge only under your normal approval process. |
| `FAIL`, `fail`, or `FAILED` | The selected contract did not pass. | Reproduce locally; inspect the code and contract. |
| `PAYMENT_REQUIRED` or HTTP 402 | The accepted pilot has no available verification balance. | Contact the operator through the private pilot channel. |
| `HTTP_ERROR`, timeout, 401, 403, or 5xx | Configuration, authorization, network, or service problem. | Do not label the code defective; troubleshoot the run. |
| Signed receipt verification failed | The result could not be authenticated or bound to the files. | Treat it as a trust failure and keep the gate closed. |

A valid Noticer receipt proves that the exact submitted source file passed the
exact submitted pytest contract on the Noticer gateway at that time, and that
the receipt matches the issuer's published signing key and both file digests.

It does not prove that the contract captures user intent, that the whole
repository/build/deployment or a production side effect worked, that no other
bug or vulnerability exists, that a regulator or independent auditor approved
the system, or that a local transparency chain has an external witness.

### Step 6 — keep the first pilot manual

Do not make the current beta workflow a required merge check. Before enabling
automatic pull-request runs or a required check, validate all of the following:

- a known PASS fixture, a controlled false-success fixture, and a repaired PASS
- a gateway outage and balance-exhaustion response
- protected ownership of the workflow and outcome contract
- an audited owner-only break-glass process
- customer acceptance of the runner isolation and data-handling terms listed in
  this manual's safety boundary
- a credit/billing plan that cannot be exhausted by ordinary pull-request churn

When those conditions are met, a repository administrator may separately add a
stable job name to a branch ruleset. A required check still does not replace code
review, ownership approval, or existing required checks.

## 6. How the installed run works

```text
Owner-approved manual run
          │
          ▼
GitHub checks out the selected commit
          │
          ▼
Causal Verify reads one source file + one pytest file
          │
          ▼
Those two files go to the configured Noticer gateway over HTTPS
          │
          ▼
The contract runs in the managed verification environment
          │
          ▼
The gateway returns a signed result
          │
          ▼
The Action verifies the signature and both file digests
          │
          ▼
GitHub shows a green or red status check
```

The complete contents of the two configured files are read and submitted by the
Action. The signed receipt contains hashes and result metadata rather than the
submitted source, tests, API key, or private signing material. The public
documentation does not currently state a source-retention/deletion guarantee or
SLA, so use only public or synthetic non-sensitive code during the controlled
beta.

## 7. Download options

### Normal GitHub use: no manual software download

The workflow's `uses:` line tells GitHub to fetch the pinned Action
automatically. You do not install a package on your laptop and do not run
`npm install` for the GitHub-hosted workflow.

### Optional: download the open-source connector

**With Git:**

```bash
git clone https://github.com/zensteagarden/causal-verifier-action.git
cd causal-verifier-action
```

**Without Git:**

1. Open <https://github.com/zensteagarden/causal-verifier-action>.
2. Select **Code** → **Download ZIP**.
3. Extract the ZIP into a new folder.

Downloading the connector does not provide a pilot API key and does not install
the managed Noticer service.

## 8. Verify a saved receipt locally

The repository includes a dependency-free Node.js receipt verifier. Use Node.js
20 or newer.

From the downloaded repository:

```bash
node verify-receipt.js --receipt /path/to/receipt.json
```

By default, this fetches only the gateway's public verification-key set. To bind
the receipt to your exact local files:

```bash
node verify-receipt.js \
  --receipt /path/to/receipt.json \
  --source /path/to/solution.py \
  --tests /path/to/test_solution.py
```

For a completely disconnected check, save the public key set first and add:

```bash
--keys /path/to/keys.json
```

The verifier prints:

- `VALID` when the signature, trusted key, statement, and supplied file digests
  verify
- `INVALID` when the receipt is malformed, altered, or does not match a supplied
  file
- `UNTRUSTED` when the signing key is unpublished, unsupported, or revoked

The GitHub Action does not currently save the raw receipt JSON as a workflow
artifact automatically. Use a receipt supplied through the accepted pilot's
safe evidence process.

## 9. Troubleshooting

### “Missing input api-key”

- Confirm the pilot was accepted and a key was privately provisioned.
- Confirm the secret name is exactly `CAUSAL_ENGINE_API_KEY`.
- Confirm the workflow uses `${{ secrets.CAUSAL_ENGINE_API_KEY }}`.
- If the pull request comes from a fork or Dependabot, the secret is intentionally
  unavailable.

Never print the secret to test whether it exists.

### “source-path does not exist” or “test-path does not exist”

- Use repository-relative paths.
- Match capitalization exactly.
- Confirm both files exist in the commit being checked.
- Keep both paths inside the GitHub workspace; escaping paths and symlinks are
  rejected.

### HTTP 401 or 403

The key is missing, invalid, revoked, or not authorized. Contact the operator
through the accepted private pilot channel. Do not paste the key into a support
message.

### HTTP 402 / `PAYMENT_REQUIRED`

The pilot has no available verification balance. This is not a code verdict.
Contact the operator through the private pilot channel and do not follow an
unverified payment link.

### Timeout, HTTP 5xx, or `HTTP_ERROR`

Treat this as an operational failure. Retry once if appropriate, record the run
URL and request ID, and contact the operator if it continues.

### Signed receipt failure

Keep the gate closed. Record the run URL, receipt ID if shown, request ID, and
error classification. Do not disable signed-receipt verification to make a
trusted gate pass.

### Unexpected PASS

A weak test can pass while missing the real requirement. Tighten the contract so
it checks the observable result and a nearby failure case. Noticer authenticates
the executed result; it does not invent a complete contract for you.

## 10. Security and privacy checklist

Before submitting or installing:

- [ ] The free-trial repository and evidence may be public.
- [ ] I own or am authorized to upload and remotely execute the selected files.
- [ ] The selected source and test are public or synthetic and contain no
      credentials, personal data, regulated data, or private customer code.
- [ ] The unique, limited key exists only in the protected beta environment or
      another operator-approved secret store.
- [ ] The workflow uses the official gateway and immutable Action pin.
- [ ] Signed-receipt verification remains enabled.
- [ ] Debug logging is off; workflow code does not print headers or responses.
- [ ] The workflow and outcome contract are protected from unauthorized changes.
- [ ] The run is manual and uses an owner-approved ref, not an external fork.
- [ ] No production database, production secret, or payment credential is needed.
- [ ] Security vulnerabilities are reported privately under `SECURITY.md`, not in
      a public issue.

For safe support, share only:

- the GitHub Actions run URL
- the pinned Action commit
- HTTP status and normalized status
- error type
- request ID and receipt ID, if returned
- whether the official gateway was used

Do not share the API key, authorization headers, private source, raw unredacted
gateway responses, customer data, or screenshots containing secrets.

## 11. First-user completion checklist

You have completed the first-user path when:

- [ ] You can state one required result in the “When…, …must be true” format.
- [ ] You completed the free proof or received acceptance for a controlled pilot.
- [ ] The source path and pytest path are explicit.
- [ ] The key is stored only as `CAUSAL_ENGINE_API_KEY` in the protected beta
      environment or another operator-approved secret store.
- [ ] The workflow uses immutable commit pins.
- [ ] You can distinguish contract FAIL from HTTP or balance errors.
- [ ] You understand that PASS covers one named result, not the whole application.
- [ ] You kept existing GitHub checks, review, and deployment controls in place.

## 12. Licensing and authority

The open-source Causal Verify connector and local receipt verifier in the public
repository are licensed under that repository's MIT license. That license does
not license the separately hosted Noticer gateway, private service code, signing
private keys, customer code, or the Noticer name. A customer must have the right
to upload and remotely execute every selected source and test file and remains
responsible for third-party licenses and dependencies.

## 13. Official links

- Repository: <https://github.com/zensteagarden/causal-verifier-action>
- Free proof request: <https://github.com/zensteagarden/causal-verifier-action/issues/new?template=free-outcome-proof.yml>
- Controlled beta rules: <https://github.com/zensteagarden/causal-verifier-action/blob/main/docs/CONTROLLED_BETA.md>
- Security policy: <https://github.com/zensteagarden/causal-verifier-action/blob/main/SECURITY.md>
- GitHub Actions secrets: <https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets>
- GitHub secret restrictions: <https://docs.github.com/en/code-security/reference/secret-security/secret-types>
- GitHub required checks and rulesets: <https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets>

---

**Public-safety note:** This manual intentionally contains placeholders rather
than live credentials, personal contact information, private repository names,
customer data, or private service internals. It is a usage guide, not a legal,
security, uptime, or data-retention guarantee.
