# marketing — SDUI blueprints

Blueprint declarations for the marketing module's server-driven UI surfaces.

## Surfaces

### `resources/marketing-event/`

Tenant-facing marketing event ledger. Owner + admin + marketing role + support
role.

- `list.screen.json` — filterable event ledger with status chips + retry count
  bar. Filters on event_type, status, date range, subject_type, utm_source.
- `view.screen.json` — full detail on one event: base fields + attribution
  snapshot + consent snapshot + per-provider delivery ledger. Includes an
  "Re-dispatch" action for support tooling.

### `resources/marketing-provider/`

Tenant-facing provider CRUD. Owner + admin.

- `list.screen.json` — active providers grid with status chip + circuit-breaker
  badge + last-success indicator.
- `create.screen.json` — multi-step wizard: provider picker → credentials form
  (per-provider schema) → event types picker → test-mode toggle → confirm.
- `edit.screen.json` — same fields as create, minus provider slug (immutable).
- `test.screen.json` — send a synthetic test event; live-updates with result +
  latency + error details.

### `resources/marketing-dead-letter/`

Tenant-facing dead-letter queue. Owner + admin + marketing role + support role.

- `list.screen.json` — unresolved-default filter; filterable by provider +
  reason. Bulk-resolve action for ops.
- `replay.screen.json` — dedicated replay flow: shows the event + last error +
  provider + confirmation prompt with a required note.

### `resources/marketing-roas/`

ROAS dashboard. Medium+ only via `marketing_roas_report` entitlement. Owner +
admin + marketing role.

- `dashboard.screen.json` — top-level ROAS report: filter by date range + group
  by campaign / source / medium. Revenue-attribution grid + per-provider
  breakdown chart.

### `widgets/`

- `provider-status-chip.widget.json` — colour-coded chip for provider health
  (active + circuit-closed / active + circuit-half-open / active + circuit-open
  / inactive).
- `circuit-breaker-badge.widget.json` — dedicated badge showing circuit state
  - open-until timestamp + consecutive_failure_count.
- `event-type-picker.widget.json` — multi-select for enabled_event_types with
  provider-capability-matrix filtering (hides unsupported types per selected
  provider).
- `provider-picker.widget.json` — single-select for provider slug with
  entitlement-aware filtering (hides advanced providers on Small tier).
