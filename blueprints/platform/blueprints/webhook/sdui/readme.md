# webhook — SDUI blueprints

Server-Driven UI for the webhook module. Two resource surfaces + one lifecycle
widget.

## Surfaces

### `resources/webhook-subscription/`

Tenant admin CRUD for webhook subscriptions.

- `list.screen.json` — filterable by state + destination + event; Menu actions
  per row (pause/resume/test/rotate-secret/delete).
- `show.screen.json` — subscription detail with recent deliveries timeline +
  rotation grace indicator + auto-disable reason (when disabled).
- `create.screen.json` — new subscription with destination picker (feature-flag
  gated) + events multi-select from catalog + api_version selector.
- `edit.screen.json` — metadata edits + subscription version rollback via
  HasVersions.

### `resources/webhook-delivery/`

Read-only + retry surface for delivery audit.

- `list.screen.json` — filterable by subscription + state + event; row action =
  retry (only enabled for `failedPermanent`).
- `show.screen.json` — delivery detail with request headers + truncated response
  body + duration + signature material (redacted for non-owner).

### `widgets/`

- `webhook-delivery-status-chip.widget.json` — 6-state colour-coded chip:
  pending grey, inFlight info, delivered success, failedRetryable warning,
  failedPermanent danger, cancelled neutral. Consumed by delivery listings +
  admin dashboards.

## Data sources

- `webhookSubscriptions` — paginated list.
- `webhookSubscription` — single with `include=deliveries` (last 20 for the
  timeline).
- `webhookDeliveries` — paginated list.
- `webhookDelivery` — single with full request/response headers.
- `webhookEventsCatalog` — publishable events from
  `GET /api/v1/tenant/webhook/events`.
- `webhookDestinationsCatalog` — available destination drivers from
  `GET /api/v1/tenant/webhook/destinations` (feature-flag filtered).
- `apiVersions` — released + deprecated ApiVersion rows for the api_version
  picker.

## Broadcast subscriptions

None. Delivery state transitions are frequent — polling suffices for the audit
surface. Admin notifications on subscription disable/upgrade come via mail +
in-app instead of live-updating dashboards.
