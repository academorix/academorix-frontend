# monitoring — SDUI blueprints

Blueprint declarations for the monitoring module's server-driven UI surfaces.

## Surfaces

### `resources/health-check/`

Tenant-facing health check CRUD. Owner + admin + ops. Support role sees runs
history read-only.

- `list.screen.json` — filterable health check grid with status chip + last-run
  latency. Filters on check_type, is_enabled, last_run_status.
- `create.screen.json` — multi-step wizard: check_type picker → target form
  (per-check-type schema) → interval + timeout → confirm.
- `edit.screen.json` — same fields as create, minus check_type (immutable).
- `detail.screen.json` — full detail on one health check: config + last 24h of
  runs (chart) + attached alert policies. Includes "Run now" action for support
  tooling.
- `runs.screen.json` — filterable run history table.

### `resources/monitoring-alert-policy/`

Tenant-facing alert policy CRUD. Owner + admin + ops.

- `list.screen.json` — active policies with severity chip + last-triggered
  count.
- `create.screen.json` — multi-step wizard: signal_type picker → signal_source →
  threshold (operator + value + unit) → severity + window + consecutive breaches
  → notification routing (provider picker) → suppression config.
- `edit.screen.json` — same fields as create.

### `resources/monitoring-alert/`

Tenant-facing alert ledger + acknowledgment actions. Ops + admin + owner +
support (view only).

- `list.screen.json` — active alerts with severity chip + fire timeline +
  acknowledge/resolve inline actions. Default filter: status=firing.
- `acknowledge.screen.json` — dedicated acknowledgment flow with optional note.

### `resources/monitoring-incident/`

Tenant-facing incident timeline management. Ops + admin + owner + support.

- `list.screen.json` — filterable incident grid with severity chip + duration +
  attached alert count.
- `detail.screen.json` — full timeline of the incident: attached alerts, status
  transitions, ops actions. Postmortem link (P1 only).
- `resolve.screen.json` — dedicated resolve flow with required note + optional
  postmortem URL.

### `resources/monitoring-provider/`

Tenant-facing provider CRUD. Owner + admin.

- `list.screen.json` — active providers with status chip + circuit-breaker
  badge + last-success indicator.
- `create.screen.json` — multi-step wizard: provider picker → credentials form
  (per-provider schema) → enabled severities picker → test-mode toggle →
  confirm.
- `edit.screen.json` — same fields as create, minus provider slug (immutable).
- `test.screen.json` — send a synthetic P4 test alert; live-updates with
  result + latency.

### `resources/monitoring-dashboard/`

Tenant-facing aggregated monitoring dashboard. Ops + admin + owner + support.

- `dashboard.screen.json` — top-level ops dashboard: health check summary chart,
  active alerts by severity, open incidents count, MTTR trend, top 5 failing
  checks, provider health widget.

### `widgets/`

- `severity-chip.widget.json` — colour-coded chip for severity (p1 danger, p2
  warning, p3 info, p4 neutral).
- `status-badge.widget.json` — colour-coded badge for alert status (firing
  danger, acknowledged warning, resolved success, suppressed neutral) + incident
  status (open danger, acknowledged warning, investigating info, mitigating
  info, resolved success, postmortem neutral).
- `provider-status-chip.widget.json` — colour-coded chip for provider health
  (active + circuit-closed / active + circuit-half-open / active + circuit-open
  / inactive).
- `circuit-breaker-badge.widget.json` — dedicated badge showing circuit state
  - open-until timestamp + consecutive_failure_count.
