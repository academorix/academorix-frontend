# Architecture Decision Records

This directory records the significant architectural decisions made in the
Stackra frontend (and the accompanying blueprint / backend surface it
describes). Every ADR follows the same shape used by the sibling
`stackra-backend/` repository — Context, Options, Decision, Consequences,
Related work.

## Numbering + supersession

- Sequential numbering. Every number is used; there are no gaps.
- Never delete an ADR. To reverse a decision, ship a new ADR that supersedes the
  old one and update the old ADR's header with
  `**Superseded by:** [ADR NNNN](NNNN-<slug>.md)`.
- Status transitions: `Proposed` → `Accepted` → `Deprecated` /
  `Superseded by ADR NNNN`.

## Index

Rows 0001–0023 originate at `stackra-backend/docs/adr/` and are cross-
referenced across `.kiro/agents/*.md` and `.kiro/steering/*.md`. This working
directory adds ADR 0024 onward; when this tree consolidates back into
`stackra-backend/`, the numbering stays continuous.

| #                                                      | Title                                                                                                    | Status   |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | -------- |
| 0001–0023                                              | See `stackra-backend/docs/adr/README.md`                                                                 | Accepted |
| [0024](0024-enrollment-funnel-not-a-crm.md)            | Enrollment funnel is not a CRM (drop `growth/crm-leads`, absorb into `sports/registrations`)             | Accepted |
| [0025](0025-integrations-two-lane-model.md)            | Integrations two-lane model — provider slots now, marketplace app substrate for later                    | Accepted |
| [0026](0026-agent-canonical-directory.md)              | Canonical directory for agent charters                                                                   | Accepted |
| [0027](0027-row-level-attribution-three-axes.md)       | Row-level attribution: the three-axes column contract (`tenant_id` / `application_id` / `scope_node_id`) | Accepted |
| [0028](0028-runtime-target-laravel-octane.md)          | Runtime target: Laravel Octane (persistent workers, framework overhead amortised)                        | Accepted |
| [0029](0029-audit-consolidation.md)                    | Audit consolidation — canonical audit at `observability/audit`; delete `shared/audit`                    | Accepted |
| [0030](0030-payment-methods-ownership.md)              | `payment_methods` ownership — canonical at `finance/payment/`; delete `finance/gateway/` copy            | Accepted |
| [0031](0031-application-id-central-plane-extension.md) | `application_id` central-plane extension — 8-row mandate becomes 12-row named list                       | Accepted |
| [0032](0032-six-service-split.md)                      | Six-service deployment split (Option B) — four shared + two per-Application                              | Accepted |
| [0033](0033-cross-service-authentication-contract.md)  | Cross-service authentication contract — user JWT + machine `X-Service-Identity` header                   | Accepted |
| [0034](0034-octane-driver-swoole.md)                   | Octane driver: Swoole (chosen over RoadRunner + FrankenPHP; 12-month review cadence)                     | Accepted |
| [0035](0035-migration-dependency-ordering.md)          | Migration dependency ordering — `#[DependsOn]` attribute + marker classes + boot-time DAG resolver       | Accepted |

The next available number is **0036**.

## Companion + superseded ADRs

- **ADR-0028** is companioned by **ADR-0034** — the runtime target decision
  (Octane) and its driver selection (Swoole) were designed together. ADR-0034 is
  scoped to be swappable without touching ADR-0028.
- **ADR-0032** is companioned by **ADR-0033** — the six-service split and its
  cross-service auth contract were designed together in the same commit.
- **ADR-0029** superseded the earlier `shared/audit` design; the source package
  was deleted 2026-07-21 in the same commit as ADR-0032.
- **ADR-0031** extends **ADR-0027** — the 8-row `application_id` mandate becomes
  a named 12-row list. ADR-0027 is NOT superseded; both remain in force.
