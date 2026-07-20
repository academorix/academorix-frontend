# analytics — SDUI blueprints

Server-Driven UI for analytics admin surface. Six resource surfaces + four
lifecycle widgets. Read-heavy — most tenant work is inspecting events + managing
provider configs; only identity-merge is a mutation of any weight.

## Surfaces

### `resources/analytics-event/`

Tenant admin surface for the event log. Read-only over HTTP (create paths are
listener-only).

- `list.screen.json` — filterable by event_name + event_kind + category +
  status + date range. Fires the analytics-event-status-chip widget per row.
- `show.screen.json` — event detail with properties + context + attribution
  snapshot + consent snapshot + per-provider delivery list.

### `resources/analytics-provider-config/`

Tenant admin surface for provider CRUD.

- `list.screen.json` — provider list with health chip + circuit breaker chip
  - fanout stats. Menu action per row.
- `create.screen.json` — provider setup wizard (choose provider → configure
  credentials → configure sampling + batching → test).
- `edit.screen.json` — update sampling, enabled_event_types, batch_config.
  Credentials rotation via a dedicated sub-panel with confirmation modal.
- `test.screen.json` — dispatch a synthetic test event; render provider
  response + status.

### `resources/analytics-identity/`

Tenant admin surface for identity resolution.

- `list.screen.json` — identity list filtered by identified vs anonymous. Menu
  action per row (merge, identify, deidentify).
- `merge.screen.json` — merge wizard (choose survivor + mergees, preview
  affected event count, confirm).

### `resources/analytics-funnel/`

- `report.screen.json` — funnel report screen. Prompts for funnel_key + date
  range + group-by; renders bar chart per step + conversion rates + drop-off
  analysis.

### `resources/analytics-experiment/`

- `report.screen.json` — experiment results screen. Prompts for experiment_key +
  metric + confidence level; renders variant comparison + uplift + p-value +
  sample size.

## Widgets

- `analytics-event-status-chip.widget.json` — colour-coded chip for
  AnalyticsEvent.status: delivered = success, partially_delivered = warning,
  suppressed_* = muted, pending / dispatching = info.
- `analytics-event-category-chip.widget.json` — colour-coded chip for
  AnalyticsEvent.category with icons per category.
- `analytics-provider-badge.widget.json` — provider brand badge with logo +
  name. Consumed by delivery list + provider config list + event detail.
- `analytics-sampling-indicator.widget.json` — small inline indicator showing
  configured sampling rate. Renders "100%" green, "10-99%" info, "<10%" warning,
  "0%" muted.
