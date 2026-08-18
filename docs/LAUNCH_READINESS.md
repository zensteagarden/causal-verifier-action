# MVP Launch Readiness

Updated: 2026-08-18

## Completed

- Production GitHub Action released as `zensteagarden/causal-verifier-action@v1`
- Immutable `v1.0.0` release published
- Node 24 runtime and CI migration
- Required pytest verification contracts
- Secret masking verification
- Gateway URL credential protection
- Workspace path and symlink escape protection
- Offline coverage for pass, fail, legacy `SETTLED`, HTTP 402, source leakage, and path escapes
- Nine offline tests passing at the v1.0.0 release gate
- Live synthetic gateway smoke test returned HTTP 200 and legacy `SETTLED`
- Public API compatibility contract drafted
- Five-minute Action quickstart drafted
- Security and safe-support guidance drafted

No real credentials or proprietary source were used in release testing. The live smoke-test credential was held locally and was not sent through chat.

## Blocked on gateway source access

These items require the repository and deployment configuration for `causal-engine-gateway.fly.dev`:

- official installable MCP package
- server-side rate limiting and abuse controls
- developer dashboard for keys, credits, and recent runs
- structured logging, metrics, and alerts
- sandbox concurrency and isolation hardening
- metering edge-case tests
- response and error normalization
- API-key rotation and revocation workflow
- Stripe upgrade-flow verification
- deployment rollback and incident runbooks

The connected GitHub account currently exposes the Action repository and unrelated projects, but not an identifiable gateway source repository. Do not implement these features by guessing at production architecture.

## External launch evidence still required

- clean-machine quickstart timing under five minutes
- successful use by at least 10 external developers
- feedback from initial design partners
- measured verification error and sandbox failure rates
- confirmed free-to-paid conversion signal

## Deferred owner decisions

These choices do not block documentation work and should be handled together near launch:

1. Pricing model. Recommended MVP default: monthly credit bundles with a clearly stated overage or hard stop.
2. Free-tier grant and abuse threshold. Current handoff says 20 credits; confirm before publishing pricing copy.
3. Additional languages. Recommended: keep Python-only through the controlled launch.
4. Dashboard scope. Recommended: key creation/rotation, credit balance, and recent runs only.
5. Private vulnerability contact. Enable GitHub private vulnerability reporting or publish a dedicated security email.
6. Gateway source location. Connect or identify the production repository so server-side work can proceed.
7. Support channel. Choose one monitored, private channel and document expected response times.

## Launch gate

Do not claim the entire MVP is ready until every gateway-source item required by the Definition of Done is implemented and verified. The GitHub Action component is released and live-tested; the broader platform remains a controlled pre-launch product.
