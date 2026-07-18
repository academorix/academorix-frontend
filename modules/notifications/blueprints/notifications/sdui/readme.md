# notifications core — SDUI blueprints

Server-Driven UI blueprints authored to the `@stackra/sdui` wire contract. Every
screen and widget in this folder is a JSON document that resolves to an
`ISduiScreen` at runtime — the frontend renders them via `<SduiTree>` without
hard-coding a React component per surface.

## Surfaces this module owns

### Resource CRUD (`resources/`)

| Folder          | Role                                                                                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification/` | User-facing inbox: `list.screen.json` (bell-driven filtered list with mark-seen + archive actions) and `show.screen.json` (single notification detail with delivery breakdown). Subscribes to `user.{id}.notifications` for live updates. |
| `template/`     | Tenant-admin template manager: `list`, `show`, `create`, `edit`. Body editor previews the pre-rendered HTML (React Email output with Blade placeholders).                                                                                 |
| `preference/`   | User's preference grid: `edit.screen.json`. (Category × Channel) toggle matrix + quiet hours + digest mode. No `list` — preferences are a per-user singleton.                                                                             |
| `category/`     | Read-only category registry: `list.screen.json`. Powers the "what will I be notified about?" reference view.                                                                                                                              |

### Bespoke screens (`screens/`)

| File                      | Role                                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-sends.screen.json` | Tenant-admin dashboard: aggregate send volumes, delivery failure spikes, provider health snippets. Subscribes to `tenant.{id}.notifications`. |

### Widgets (`widgets/`)

| File                               | Role                                                                                                                                                                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notification-bell.widget.json`    | Navbar bell with unseen-count badge. Composes into the app shell of every authenticated tenant surface.                                                                               |
| `notification-card.widget.json`    | Single-row card. Composes into inbox list + admin sends dashboard.                                                                                                                    |
| `delivery-status-chip.widget.json` | Colour-coded chip for a NotificationDelivery.state. Consumed by inbox show + admin sends. Downstream modules use it too (e.g. invitations show renders a chip per attached delivery). |
| `channel-icon.widget.json`         | Small icon for a channel slug (mail / sms / push / in_app). Consumed by chips + rows + preference grid.                                                                               |

## Wire contract quick reference

Same as elsewhere. Screens declare `dataSources[]` up front, build a `nodes[]`
tree with `kind` / `props` / `bindings` / `actions` / `children`.
`bindings.$ref` reads from a resolved data source; `bindings.$expr` runs through
the sandboxed expression evaluator.

## Data sources this module publishes

- `notifications` — auth user's inbox (paginated).
- `notification` — single-record fetch
  (`GET /api/v1/tenant/notifications/{id}?include=deliveries,category,template`).
- `notificationDeliveries` — subordinate to a notification, resolved via
  includes.
- `notificationTemplates` — tenant template list (paginated).
- `notificationTemplate` — single template with body preview.
- `notificationPreferences` — per-user preference grid
  (`GET /api/v1/tenant/notification-preferences`).
- `notificationCategories` — full category registry
  (`GET /api/v1/tenant/notification-categories`, or fallback to platform admin
  cross-tenant view for support).
- `notificationChannels` — the 4 channel reference values
  (`GET /api/v1/tenant/notification-channels`).
- `tenantSendStats` — admin-sends aggregate
  (`GET /api/v1/tenant/notifications/stats?window=7d`).

## Broadcast subscriptions

- `user.{userId}.notifications` — new + seen + archived events. Powers live
  bell + inbox update.
- `tenant.{tenantId}.notifications` — aggregate send stats + failure signals.
  Powers admin dashboard.

## What this module does NOT ship

- No mail-suppression / push-subscription / sms-opt-out screens — those live in
  the respective channel modules.
- No provider-webhook admin surface — inbound webhooks are silent per-channel;
  failure diagnostics surface on the admin sends dashboard here.
