# activity — SDUI blueprints

Server-Driven UI blueprints authored to the `@stackra/sdui` wire contract. Every
screen, form, and widget in this folder is a JSON document that resolves to an
`ISduiScreen` at runtime — the frontend renders them via `<SduiTree>` without
hard-coding a React component per surface.

## Surfaces this module owns

### Resource CRUD (`resources/`)

Two resources: read-only `activity` (writes happen via the vendor `LogsActivity`
trait, never HTTP) and full CRUD `activity-retention-policy` (Enterprise-gated).

| File                                                          | Role                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resources/activity/list.screen.json`                         | Paginated activity feed. Filters (log_name, subject_type, causer, date range, batched-only), read-only rows, expand-batch inline action. Subscribes to `tenant.{id}.activity` for live updates when entitled.                                               |
| `resources/activity/show.screen.json`                         | Single activity detail. Header with log_name chip + timestamp. Structured properties table (from `properties` JSONB). Batch siblings section when part of a group. Links to subject + causer detail pages.                                                  |
| `resources/activity-retention-policy/list.screen.json`        | List of retention policies for the tenant. Effective default (config) shown as a synthetic first row. Per-policy row with retention_days, log_name scope, override_reason preview, expires_at.                                                              |
| `resources/activity-retention-policy/create.screen.json`      | Retention-override form. log_name select (empty = all), retention_days slider (30-730), override_reason textarea (min 20 chars), optional expires_at date picker. Entitlement banner when the tenant lacks `activity_retention_extended`.                   |
| `resources/activity-retention-policy/show.screen.json`        | Policy detail. History timeline (via HasAudit rows). Delete affordance with confirmation. 'Revert to default' shortcut.                                                                                                                                     |

### Bespoke screens (`screens/`)

Additional non-CRUD screens.

| File                                | Role                                                                                                                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `screens/by-entity.screen.json`     | The activity stream for one entity. Given a subject_type + subject_id, renders the entity's activity timeline. Deep-linked from every domain resource's show screen ('View activity on this booking').    |
| `screens/by-user.screen.json`       | One actor's activity. Given a user_id, renders their causer stream. Callers see only themselves unless they hold `activity.audit_any`.                                                                    |
| `screens/feed-viewer.screen.json`   | Dashboard-widget viewer — the compact 'Recent activity' panel that mounts on the tenant dashboard. Streams live via WebSocket when entitled; polls otherwise. Filter by log_name; click through to detail. |

### Widgets (`widgets/`)

Reusable components composable from any screen.

| File                                | Role                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `widgets/activity-timeline.widget.json` | The canonical timeline renderer — a vertical list of activity rows with grouped date headers, batch-collapsed items, subject/causer chips, action links. Consumed by list.screen.json + by-entity.screen.json + by-user.screen.json + feed-viewer.screen.json. Downstream modules embed it on their own resource-show screens. |

## Wire contract quick reference

Same as elsewhere in the platform. Screens declare `dataSources[]` up front,
build a `nodes[]` tree with `kind` / `props` / `bindings` / `actions` /
`children`. `bindings.$ref` reads from a resolved data source;
`bindings.$expr` runs through the sandboxed expression evaluator.

## Data sources this module publishes

- `activity` — single-record fetch
  (`GET /api/v1/activities/{id}?include=subject,causer,batchSiblings`).
- `activities` — paginated list (`GET /api/v1/activities`) with filter / sort /
  include support.
- `activitiesByEntity` — inline enumeration
  (`GET /api/v1/activities/by-entity/{type}/{id}`) — powers the entity timeline.
- `activitiesByUser` — inline enumeration
  (`GET /api/v1/activities/by-user/{user}`).
- `activitiesMine` — `GET /api/v1/activities/mine`.
- `activityFeedInfo` — `GET /api/v1/activities/feed` — returns the channels the
  caller should subscribe to + entitled flag + polling interval.
- `activityRetentionPolicies` — `GET /api/v1/activity-retention-policies`.
- `logNameCatalog` — synthetic data source over
  `data/log-names-catalog.json` — powers the log_name filter selects.

## Broadcast subscriptions

The `list.screen.json` + `by-entity.screen.json` + `by-user.screen.json` +
`feed-viewer.screen.json` subscribe to `tenant.{tenantId}.activity` +
`user.{userId}.activity` when the tenant is entitled. The `dataSources[]`
declare a `subscriptions[]` block that resolves at runtime — when broadcast is
unavailable, the frontend polls the underlying HTTP endpoint on the interval
returned by `activityFeedInfo`.

## Consumer embedding

Downstream consumer modules embed the `activity-timeline` widget on their
resource-show screens via the SDUI `Widget` kind:

```json
{
  "kind": "Widget",
  "widget": "activity.timeline",
  "props": {
    "subjectType": "booking",
    "subjectId": { "$ref": "row.id" },
    "limit": 10,
    "showFilters": false,
    "emptyState": {
      "title": "No activity yet on this booking"
    }
  }
}
```

Zero coupling between this module and downstream consumers. Consumers pass
`subjectType` + `subjectId`; the widget handles everything else — resolving the
timeline data source, subscribing to relevant broadcast channels, rendering
rows with the correct log_name-aware formatting.
