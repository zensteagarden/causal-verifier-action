# GitHub CI + Noticer tandem proof

This is a deliberately small synthetic demonstration of one narrow claim:

> A successful order response means the corresponding order record actually exists.

Two independent GitHub jobs evaluate the same commit:

- `baseline-ci` runs the repository's deliberately narrow test. It checks only the success response.
- `noticer-outcome-gate` sends the source and the frozen stronger outcome contract to the live verification gateway, then requires a valid signed receipt.

## Frozen three-state sequence

| State | Implementation | baseline-ci | noticer-outcome-gate |
| --- | --- | --- | --- |
| Control | Returns success and stores the order | PASS | PASS |
| False success | Returns success but omits the storage write | PASS | FAIL |
| Repair | Restores the storage write | PASS | PASS |

The baseline test and Noticer outcome contract do not change between states. Only the implementation changes.

## What this proves

If all three states produce the expected matrix, it supports this limited claim:

> On this frozen workflow and contract, the Noticer gate detected a defined false-success condition that the baseline CI test did not, while accepting the nearby correct implementation.

It does not prove universal bug detection or that Noticer can infer every required outcome automatically.
