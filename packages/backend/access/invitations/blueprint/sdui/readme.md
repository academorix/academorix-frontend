# invitations — SDUI blueprints

Server-Driven UI blueprints authored to the `@stackra/sdui` wire contract. Every
screen, form, and widget in this folder is a JSON document that resolves to an
`ISduiScreen` at runtime — the frontend renders them via `<SduiTree>` without
hard-coding a React component per surface.

## Surfaces this module owns

### Resource CRUD (`resources/invitation/`)

Admin-facing invitation management, rendered inside the tenant dashboard.

| File                 | Role                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list.screen.json`   | Paginated invitations table with filters (state, target_type, email), bulk actions (revoke, resend), and inline actions per row. Subscribes to the `tenant.{id}.invitations` broadcast channel for live status updates. |
| `create.screen.json` | Send-invitation form. Fields: email, target picker, role selector, channel, custom message, expiry override. Consumer-supplied target types render dynamically from `InvitationTargetRegistry`.                         |
| `show.screen.json`   | Invitation detail. Header with status chip + lifecycle actions. Timeline component streaming from `invitation.events`. Sidebar with metadata + resend / revoke buttons.                                                 |

### Bespoke screens (`screens/`)

Public-facing surfaces served on the central host with no authentication.

| File                             | Role                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accept-invitation.screen.json`  | Token-based acceptance flow. Tenant-branded, includes inviter identity, target label, consent capture, password / SSO / passkey option per provider registry. |
| `decline-invitation.screen.json` | One-page decline. Optional reason. Terminal state, no follow-up.                                                                                              |

### Widgets (`widgets/`)

Reusable components composable from any screen.

| File                                 | Role                                                                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `invitation-status-chip.widget.json` | Colour-coded status chip. Consumed by the resource list, show screen, and downstream modules that display invitation state in their own resource screens (e.g. Team member list shows "invited" chip for pending invitations). |

## Wire contract quick reference

Same as elsewhere in the platform. Screens declare `dataSources[]` up front,
build a `nodes[]` tree with `kind` / `props` / `bindings` / `actions` /
`children`. `bindings.$ref` reads from a resolved data source; `bindings.$expr`
runs through the sandboxed expression evaluator.

## Data sources this module publishes

- `invitation` — single-record fetch
  (`GET /api/v1/tenant/invitations/{id}?include=events,target,inviter,acceptedBy`).
- `invitations` — paginated list (`GET /api/v1/tenant/invitations`) with filter
  / sort / include support.
- `invitationTargets` — list of registered target types + their labels
  (`GET /api/v1/tenant/invitations/target-types` — provided by
  `InvitationTargetRegistry`).
- `tenantBrandingPreview` — public tenant preview for the accept + decline
  screens (`GET /api/current-tenant` via host resolution).
- `invitationPreview` — public invitation preview for the accept + decline
  screens (`GET /api/invitations/{token}`).

## Broadcast subscriptions

The `list.screen.json` + `show.screen.json` subscribe to
`tenant.{tenantId}.invitations` (see `broadcasts.json`) to update rows live
without polling.

## Consumer-supplied targets

`create.screen.json` picks the target type via a `Select` field driven by the
`invitationTargets` data source. Each target type registered in
`InvitationTargetRegistry` provides a `target_picker_screen_ref` — an optional
SDUI screen reference the create form embeds when the target is chosen (e.g. for
`athlete` target, embeds the athlete-selector widget owned by the sports
module). Zero coupling between this module and downstream target modules.
