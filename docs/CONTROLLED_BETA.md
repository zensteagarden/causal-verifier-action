# Controlled Beta: One Free Outcome Proof

## The Offer

The first five eligible public Python repositories receive one operator-run Noticer outcome proof.

The requester provides only:

1. the public GitHub repository URL
2. one sentence: **"when ______ happens, ______ must be true."**

No email signup, credits, API key, private-repository access, production credentials, or production data is required from the tester.

## Eligibility

A request is eligible when:

- the repository is public and primarily Python
- the requester owns or maintains it, or has permission to request the proof
- the outcome can be reproduced without secrets or production access
- the outcome is observable and narrow enough to express as one pytest contract against one selected Python source file
- the requester permits the proof to appear in public GitHub evidence

Examples:

- when an order is accepted, it must be retrievable by order ID
- when access is granted, the user must be able to use the protected feature
- when a file save reports success, the expected file must exist with the required content

## Operator Procedure

1. Confirm eligibility in the public issue.
2. Identify the smallest source path and outcome contract needed for the proof.
3. Work only in an operator-owned public fork. If a draft pull request is useful, open it between branches in that same fork so the operator's key is never requested from the customer repository. Do not merge or deploy.
4. Run the repository's configured baseline checks.
5. Run Noticer against the exact selected source and frozen outcome contract.
6. Record the GitHub run links, exact commit, contract digest, verdict, and signed receipt identifier.
7. Clearly label any synthetic mutation or fixture. Never present a constructed case as a discovered production defect.
8. Return the public proof in the request thread.

## What Completion Means

The proof is complete when the evidence shows whether Noticer can distinguish a missing declared outcome from a nearby genuine success.

A completed proof does not mean:

- the repository had a real undiscovered bug
- Noticer inferred the repository owner's intent automatically
- the outcome contract is complete
- the gate blocks merges before the owner makes it required

## Safety Boundary

Do not request or accept:

- API keys, passwords, tokens, or authorization headers
- private source, proprietary customer code, or private repository details
- personal or regulated data
- arbitrary contributor code or production-connected tests
- production database access
- payment credentials
- undisclosed security vulnerabilities

Security reports must use the repository security policy rather than a public issue. The Action submits the complete selected source and test files, and the public documentation does not currently state a retention/deletion guarantee or SLA.

## After a Valuable Proof

If the repository owner wants to run the result again, scope a controlled manual pilot separately and follow the [First User Manual](FIRST_USER_MANUAL.md). The operator privately provisions a unique, limited key. The current beta workflow remains owner-dispatched and is not a required pull-request gate. Nothing is merged or deployed without the repository owner's approval.
