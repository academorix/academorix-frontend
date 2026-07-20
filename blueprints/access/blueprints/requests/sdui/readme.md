# access/requests \u2014 SDUI blueprints

Server-Driven UI blueprints authored to the `@stackra/sdui` wire contract.
Every screen and widget in this folder is a JSON document that resolves to an
`ISduiScreen` at runtime; the frontend renders them via `<SduiTree>` without
hard-coding a React component per surface.

## Surfaces this module owns

### Resource CRUD (`resources/access-request/`)

Tenant-facing self-service surface. The most-used files are the list (both
"my requests" and "pending my review") and the show detail. The `create`
screen is rarely opened directly \u2014 the primary path is the
`AccessDeniedPanel` on the 403 screen, which pre-fills the form.

| File                 | Role                                                                                                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `list.screen.json`   | Paginated access-requests table with tabs for `my_requests` / `pending_my_review` / `all` (admin only). Filters (status, resource_type, submitted_since), inline actions (view detail, withdraw / approve / reject).      |
| `create.screen.json` | Submit form. Pre-fillable via `request_payload_template` from a preceding 403. Fields: resource_type + resource_id (read-only when pre-filled), permissions_wanted checkbox list, reason TextArea.                          |
| `show.screen.json`   | Request detail. Header with status chip + lifecycle actions (approve / reject for approvers; withdraw for requester). Timeline of audit events. Sidebar with metadata (approvers list, decisions, materialised grant link). |

### Bespoke screens (`screens/`)

Public-facing surfaces served on the tenant host without RBAC gate.

| File                             | Role                                                                                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access-denied.screen.json`      | The 403 catch-all surface. Rendered by the SPA router when a route responds 403 with `code === 'access_denied.can_request'`. Shows the resource, the missing permissions, and the "Request access" affordance that opens the pre-filled create form modal. |

### Widgets (`widgets/`)

Reusable components composable from any screen.

| File                                       | Role                                                                                                                                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access-request-status-chip.widget.json`   | Colour-coded status chip: pending (info), approved (success), rejected (neutral / danger), expired (warn), cancelled (muted). Consumed by list + show screens and by every downstream module that surfaces access-request state (grants list, audit report). |

## Wire contract quick reference

Same as elsewhere in the platform. Screens declare `dataSources[]` up front,
build a `nodes[]` tree with `kind` / `props` / `bindings` / `actions` /
`children`. `bindings.$ref` reads from a resolved data source;
`bindings.$expr` runs through the sandboxed expression evaluator.

## Data sources this module publishes

- `accessRequest` \u2014 single-record fetch
  (`GET /api/v1/access-requests/{id}?include=decisions,resource,materialised_grant,requester,approvers`).
- `accessRequests` \u2014 paginated list
  (`GET /api/v1/access-requests` with filter / sort / include support).
- `pendingMyReview` \u2014 caller-as-approver inbox
  (`GET /api/v1/access-requests/pending-my-review`).
- `requestableResources` \u2014 map of registered `#[AccessRequestable]` types
  and their permission set (`GET /api/v1/access-requests/requestable-resources`).
- `myPermissions` \u2014 caller's currently-held permissions
  (`GET /api/auth/me` \u2192 `identity.permissions`). Powers the "already have this"
  short-circuit on the create form.

## Broadcast subscriptions

The `list.screen.json` + `show.screen.json` subscribe to both:
- `tenant.{tenantId}.access-requests` \u2014 tenant admin dashboard sees live state.
- `user.{userId}.access-requests` \u2014 requester + approver see their own inbox
  updates.

## The 403 hint UX

`access-denied.screen.json` is the standard 403 shell served whenever the SPA
receives `code === 'access_denied.can_request'` from any tenant-plane API. It
reads `resource`, `permissions_wanted`, and `request_payload_template` from
the 403 body, renders the "you don't have access" copy + a big
"Request access" button, and \u2014 when pressed \u2014 opens
`resources/access-request/create.screen.json` prefilled with the payload.
