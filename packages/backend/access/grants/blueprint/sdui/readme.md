# grants — SDUI blueprints

Server-Driven UI blueprints authored to the `@stackra/sdui` wire contract. Every
screen, form, and widget in this folder is a JSON document that resolves to an
`ISduiScreen` at runtime — the frontend renders them via `<SduiTree>` without
hard-coding a React component per surface.

## Surfaces this module owns

### Resource CRUD (`resources/access-grant/`)

Admin-facing grant management, rendered inside the tenant dashboard.

| File                 | Role                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list.screen.json`   | Paginated grants table. Filters (decision, resource_type, source, active-only), bulk actions (revoke, extend expiry), inline actions per row. Subscribes to `tenant.{id}.grants` for live updates. |
| `create.screen.json` | The full "issue grant" form — the admin-facing entry point. Distinct from the `share-access-dialog.widget.json` which is the embedded Google-Docs-style widget consumed from resource screens.     |
| `show.screen.json`   | Grant detail. Header with decision chip + lifecycle actions. Timeline (audit + activity_log stream). Sidebar with resource + subject + grantor cards. Revoke / extend expiry action bar.           |

### Bespoke screens (`screens/`)

Additional non-CRUD screens.

| File                                | Role                                                                                                                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit-resource-access.screen.json` | The compliance officer's ISO 27001 A.9.2.5 review surface. Given a resource, enumerates every grant + every RBAC role that touches it. Powers the "who has access to this thing" answer. |

### Widgets (`widgets/`)

Reusable components composable from any screen. **`share-access-dialog` is the
Google-Docs-style dialog referenced throughout this module** — it's a widget
because downstream consumer modules (finance, sports, teams, documents) embed it
directly on their resource screens.

| File                              | Role                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `grant-decision-chip.widget.json` | Colour-coded chip that renders a grant's decision + terminal state. Green (allow, active), red (deny, active), grey (revoked), amber (expired). Consumed by the grant list, detail, and every resource screen that lists grants inline.                                                                                                                                  |
| `share-access-dialog.widget.json` | The Google-Docs-style share dialog. Pick subject (typeahead across tenant Users), pick permissions (multi-select filtered by grantor's held permissions), set expiration (date picker with tenant-default preselected), add reason (textarea, min 20 chars). Embedded from resource screens on click of the "Share" button on Invoice / Athlete / Team / Document / etc. |

## Wire contract quick reference

Same as elsewhere in the platform. Screens declare `dataSources[]` up front,
build a `nodes[]` tree with `kind` / `props` / `bindings` / `actions` /
`children`. `bindings.$ref` reads from a resolved data source; `bindings.$expr`
runs through the sandboxed expression evaluator.

## Data sources this module publishes

- `grant` — single-record fetch
  (`GET /api/v1/grants/{id}?include=subject,resource,grantor,revoker`).
- `grants` — paginated list (`GET /api/v1/grants`) with filter / sort / include
  support.
- `grantTargetTypes` — the registered `resource_type` list from
  `GrantableRegistry` (`GET /api/v1/grants/target-types`) — powers the
  resource-type Select in the share dialog.
- `resourceGrantsForResource` — inline enumeration
  (`GET /api/v1/grants/resource/{type}/{id}`) — powers the "who has access to
  this thing" panel embedded on resource show screens.
- `subjectGrantsForSubject` — inline enumeration
  (`GET /api/v1/grants/subject/{type}/{id}`) — powers the "my access" view for a
  User.
- `grantorPermissions` — synthetic data source
  (`GET /api/v1/me/permissions?resource_type={type}&resource_id={id}`) that
  returns the permissions the auth_user could grant on THIS resource. Powers the
  permissions multi-select in the share dialog — it filters options so callers
  never see permissions they can't grant, avoiding the privilege-escalation
  refusal.

## Broadcast subscriptions

The `list.screen.json` + `show.screen.json` +
`audit-resource-access.screen.json` subscribe to `tenant.{tenantId}.grants` (see
`broadcasts.json`) so table + panels update without polling.

## Consumer embedding

Downstream consumer modules embed the `share-access-dialog` widget on their
resource-show screens via the SDUI `Widget` kind:

```json
{
  "kind": "Button",
  "props": { "children": "Share", "leadingIcon": "share" },
  "actions": {
    "onPress": {
      "kind": "modal.open",
      "modalWidget": "grants.share-access-dialog",
      "propsExpr": "{ resourceType: 'invoice', resourceId: row.id }"
    }
  }
}
```

Zero coupling between this module and downstream consumers. Consumers pass
`resourceType` + `resourceId`; the dialog handles everything else — resolving
target picker screen, fetching grantor permissions, submitting to the API,
updating the caller's row via broadcast.
