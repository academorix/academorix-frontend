# entitlements — SDUI blueprints

## Surfaces

### `resources/entitlement/`

Workspace-facing quota inspection.

- `list.screen.json` — grouped by feature area (Notifications, Webhooks, Storage, etc). Each row shows key + kind + cap + used + progress bar + reset time (for pool kind).
- `show.screen.json` — detail with usage chart over time + reset history + upgrade prompt when approaching cap.

Platform-admin override screens are Refine-driven auto-generated from `platform.entitlements.*` permissions — no bespoke blueprints needed here.

### `widgets/`

- `entitlement-usage-bar.widget.json` — reusable progress bar. Green < 60%, yellow 60–80%, orange 80–95%, red 95–100%. Rendered in list rows + dashboard KPI cards.
- `quota-approaching-alert.widget.json` — dismissible banner on the dashboard when any entitlement crossed 80%. Deep-links to upgrade or the specific entitlement.
