# GitHub CI + Noticer tandem proof

**Noticer** is the managed outcome-assurance service. **Causal Verify** is the GitHub Action and verifier component used by this demonstration.

This is a deliberately small synthetic demonstration of one narrow claim:

> A successful order response means the corresponding order record exists in the workflow's observable order-store state.

Two independent GitHub jobs evaluated the same commit:

- `baseline-ci` ran the repository's deliberately narrow test. It checked only the success response.
- `noticer-outcome-gate` sent the source and the frozen stronger outcome contract to the live verification gateway, then required a valid signed receipt.

## Recorded three-state sequence

| State | Commit | Live run | baseline-ci | noticer-outcome-gate |
| --- | --- | --- | --- | --- |
| Control | [`b74e4e5`](https://github.com/zensteagarden/causal-verifier-action/commit/b74e4e5670433f3c2ee425d85fe4c841b93c9281) | [run 32502863829](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32502863829) | PASS | PASS |
| False success | [`e82764d`](https://github.com/zensteagarden/causal-verifier-action/commit/e82764d085ae926178436e18dc881c2d3d452be0) | [run 32502969888](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32502969888) | [PASS](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32502969888/job/96836687769) | [FAIL](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32502969888/job/96836687992) |
| Repair | [`fa308cb`](https://github.com/zensteagarden/causal-verifier-action/commit/fa308cbbb91096b6fa89da33f966681b6fdccbb8) | [run 32503036330](https://github.com/zensteagarden/causal-verifier-action/actions/runs/32503036330) | PASS | PASS |

Implementation-only comparisons:

- [Control to false success](https://github.com/zensteagarden/causal-verifier-action/compare/b74e4e5670433f3c2ee425d85fe4c841b93c9281...e82764d085ae926178436e18dc881c2d3d452be0)
- [False success to repair](https://github.com/zensteagarden/causal-verifier-action/compare/e82764d085ae926178436e18dc881c2d3d452be0...fa308cbbb91096b6fa89da33f966681b6fdccbb8)

The baseline test and Noticer outcome contract did not change between those three recorded states. Only the implementation changed.

The false-success run reached the live verifier, returned `FAILED`, and produced a valid DSSE/Ed25519 signed receipt:

```text
receipt_id: 1d1cc0a2491a8a7cdfee894c0430333618333d2632f54f569f98ffea80f91dbb
```

The control and repaired implementation produced the same content-addressed passing receipt because their source and contract bytes were identical:

```text
receipt_id: 4f836435c0b93ed2a1b316563b5a3a4114bcc64075d3ec9f776bf2c4f175183f
```

## Honest boundary

The stronger contract is pytest and could also be run directly inside GitHub Actions. This demonstration shows the incremental value of a separately operated gate and issuer-authenticated receipt bound to the exact source and contract. It does not show a uniquely expressive test language or automatic inference of intent.

This synthetic example uses an in-memory order store. It demonstrates observable state discrimination within the test execution; it does not claim database durability.

The failing Noticer result was a real GitHub check, but this repository's current default branch is not protected by a rule requiring it. The evidence supports “returned a failing check that can be made required,” not “blocked this merge.”

## What this proves

> On this frozen synthetic workflow and contract, the Noticer gate detected a defined missing order-store outcome that the baseline CI test did not, while accepting the nearby correct implementation.

It does not prove universal bug detection or that Noticer can infer every required outcome automatically.

## Automatic operation

This is an always-on **demo canary**. Every opened, updated, reopened, or
ready-for-review pull request automatically runs the two jobs side by side:

- `baseline-ci` runs the existing narrow repository check;
- `noticer-outcome-gate` calls the live gateway and requires a valid signed
  receipt bound to the fixed demo source and approved outcome contract.

It verifies this one frozen demonstration on every pull request. It does not
claim to verify every file or behavior changed by that pull request.

The credential remains a repository secret. If it is unavailable, including on
an untrusted fork or Dependabot pull request, the Noticer job fails closed
instead of reporting an unverified success. The workflow deliberately avoids
`pull_request_target`, so untrusted pull-request code is not executed with the
repository credential.

The approved outcome-contract digest is stored outside pull-request content in
the repository variable `NOTICER_CONTRACT_SHA256`. The Action recomputes the
checked-out contract digest and refuses to contact the gateway if it differs.
The approved digest is:

```text
c0d5b6c275b81a448c26b2a19f59e92b36f86b305067bd4e9952fd9cece2d62c
```

`workflow_dispatch` remains available for an explicit rerun. The workflow pins
the Action to an immutable security-reviewed commit and no longer mints
disposable keys.
