# requests

Google-Docs-style access request workflow. When a User tries to open a resource
they don't have permission for, the platform returns a 403 that says **"you
don't have access, but here's a link to request it"** — the SPA renders a
`Request access` button, the user clicks it, the request lands in the resolved
approvers' inbox, and on approval a matching **access grant** is materialised
automatically. Full circle, zero manual DB stitching.

Wave 1b module. Priority 34. Sits on top of `workflow/approvals` (the generic
approval engine) and `access/grants` (the per-resource dynamic-access overlay).

## 1. Why this module is DELIBERATELY THIN

This module owns **no tables of its own**. The state that describes an access
request lives entirely in two upstream stores:

| State                    | Home                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| The request itself       | `workflow/approvals.approval_instances` with `action_key='access.grants.create'`                         |
| The request's approvers  | `workflow/approvals.approval_requirements` + `approval_template_approvers`                               |
| Decisions on the request | `workflow/approvals.approval_decisions`                                                                  |
| The resulting grant      | `access/grants.access_grants` with `source='access_request'` + `source_reference=<approval_instance_id>` |

The request module is a **bridge**. It exposes the Google-Docs UX shape on top
of these two systems and orchestrates the plumbing between them. Concretely it
ships:

- The `CreateAccessRequestAction` marked `#[AsApprovableAction('access.grants.create')]`
  so the `approve` middleware in `workflow/approvals` picks it up and creates
  the `approval_instance`.
- The `access.request_hint_on_denial` middleware that decorates 403 responses
  with the `request_url` + payload template the SPA needs.
- The `AccessRequestGrantMaterializer` listener that reacts to
  `ApprovalExecuted` (from `workflow/approvals`) and calls
  `access/grants::GrantIssuer::issue(...)` to create the grant.
- The `AccessRequest` DTO that projects the underlying `approval_instance` +
  `context_json` + resulting `access_grant` (if any) into the shape SPAs and
  CLI callers actually need — a single "access request" object instead of three
  cross-module joins.
- The `AccessRequestableRegistry` boot-time discovery of `#[AccessRequestable]`
  models — the substrate the middleware + validation layer consult to decide
  whether a resource type is even requestable.

If a future refactor merges `workflow/approvals` and `access/grants`, this
module survives verbatim — it doesn't know the internals of either. Bridge
modules earn their keep by locking the coupling behind a small, testable
surface.

## 2. What a Google-Docs-style flow looks like end-to-end

Concrete example — a coach (`usr_coach_01`) tries to open an invoice they
weren't granted access to.

### 2.1 The 403 with the request hint

```
GET /api/v1/invoices/inv_01H8KX...
Authorization: Bearer <coach's PAT>

→ 403 Forbidden
{
  "message": "You don't have permission to view this resource.",
  "code": "access_denied.can_request",
  "resource": {
    "type": "invoice",
    "id": "inv_01H8KX..."
  },
  "permissions_wanted": ["invoices.view"],
  "request_url": "/api/v1/access-requests",
  "request_payload_template": {
    "resource_type": "invoice",
    "resource_id": "inv_01H8KX...",
    "permissions_wanted": ["invoices.view"],
    "reason": ""
  }
}
```

The 403 is emitted by the RBAC `permission` middleware in `access/rbac`. THIS
module contributes only the `access.request_hint_on_denial` **response**
middleware — a post-response decorator that runs AFTER the RBAC middleware
refused, notices the resource type is registered in
`AccessRequestableRegistry`, and appends the four `request_*` fields to the
existing 403 body. If the resource type isn't in the registry (e.g. platform
admin surfaces, or explicitly-non-requestable rows), the 403 is left alone.

### 2.2 The SPA renders the "Request access" affordance

The SPA reads `code === 'access_denied.can_request'` from the 403 and renders
a "Request access" button + a `TextArea` for `reason`. The user types a
sentence explaining why they need it and submits.

### 2.3 The request is created

```
POST /api/v1/access-requests
Authorization: Bearer <coach's PAT>
Content-Type: application/json

{
  "resource_type": "invoice",
  "resource_id": "inv_01H8KX...",
  "permissions_wanted": ["invoices.view"],
  "reason": "Working on the quarterly close — need to reconcile this invoice."
}

→ 202 Accepted
{
  "data": {
    "id": "api_01J5R7...",
    "resource": { "type": "invoice", "id": "inv_01H8KX..." },
    "permissions_wanted": ["invoices.view"],
    "reason": "Working on the quarterly close — ...",
    "status": "pending",
    "requested_at": "2026-08-01T10:15:23Z",
    "expires_at": "2026-08-08T10:15:23Z",
    "approvers": [
      { "id": "usr_finance_lead_01", "display_name": "Alex Chen" },
      { "id": "usr_finance_admin_02", "display_name": "Sam Patel" }
    ]
  }
}
```

Under the hood, `CreateAccessRequestAction` is dispatched. It carries the
`#[AsApprovableAction('access.grants.create')]` attribute, so the `approve`
middleware from `workflow/approvals` fires first and creates the
`approval_instance` (with the four `context_json` fields above) plus the
`approval_requirements` rows resolved by `AccessRequestApproverResolver` (see
§3). The action's return payload IS the newly-created `approval_instance`
projected through the `AccessRequest` DTO.

The `id` returned is the underlying `approval_instance.id` — this module does
NOT mint its own ids. Consumers who address an access request address the
approval instance directly.

### 2.4 Approvers get notified

`NotifyApproversJob` dispatches an `AccessRequestSubmittedNotification` (mail
+ database + broadcast channels) to each approver in the resolved set. The
notification's CTA link takes them to `/tenant/access-requests/{id}` where
they see the request detail + approve/reject buttons.

### 2.5 An approver decides

```
POST /api/v1/access-requests/api_01J5R7.../approve
Authorization: Bearer <finance lead's PAT>
Content-Type: application/json

{
  "comment": "Approved — coach is on the quarterly-close rota this cycle."
}

→ 200 OK { "data": { ..., "status": "approved" } }
```

The endpoint delegates the decision to `workflow/approvals` (this module
doesn't reimplement quorum, sequential-vs-parallel evaluation, or expiry —
that's the approval engine's job). Once the requirement's quorum is satisfied
and every requirement on the instance is satisfied, `ApprovalExecuted` fires.

### 2.6 The grant is materialised

`AccessRequestGrantMaterializer` (registered as a listener via
`#[AsAccessRequestListener]`) subscribes to `ApprovalExecuted` filtered by
`action_key === 'access.grants.create'`. It calls:

```php
$this->grantIssuer->issue(new IssueGrantData(
    tenantId:     $instance->tenant_id,
    subjectType:  'user',
    subjectId:    $instance->requester_id,
    resourceType: $instance->subject_type,   // 'invoice'
    resourceId:   $instance->subject_id,     // 'inv_01H8KX...'
    permissions:  $instance->context['permissions_wanted'],
    decision:     GrantDecision::ALLOW,
    grantedBy:    $instance->context['approver_summary']['first_approver_id'],
    expiresAt:    now()->addDays(config('access.requests.default_grant_ttl_days', 7)),
    reason:       "Materialised from access request {$instance->id}",
    source:       'access_request',
    sourceReference: $instance->id,
));
```

`access/grants::GrantIssuer` writes the `access_grants` row. `AccessRequestApproved`
and `AccessRequestGrantIssued` fire in sequence. `NotifyRequesterOfDecisionJob`
delivers `AccessRequestApprovedNotification` to the coach.

### 2.7 The coach retries — and now succeeds

```
GET /api/v1/invoices/inv_01H8KX...
Authorization: Bearer <coach's PAT>

→ 200 OK { "data": { ... invoice payload ... } }
```

The RBAC gate now sees the `access_grant` row and lets the request through
(D-A3 in `access-approvals/design.md`: RBAC ∪ grants − denies). The coach
opens the invoice; no admin ever hand-created a role or hand-attached a
permission. The whole loop was self-service, auditable, and expired
automatically after 7 days by default.

## 3. Approver resolution — how the approvers list is picked

`AccessRequestApproverResolver` picks approvers for a given
`(resource_type, resource_id)` in three steps, first hit wins:

### 3.1 Approval templates (tenant-configured)

The resolver queries `workflow/approvals.approval_templates` for
`action_key='access.grants.create'` in the caller's tenant + application,
ordered by `priority` ascending. Each template's `when_expression` is
evaluated against the request context:

```
{
  resource_type: 'invoice',
  resource_id: 'inv_01H8KX...',
  permissions_wanted: ['invoices.view'],
  requester_id: 'usr_coach_01',
  requester_role_names: ['coach']
}
```

The first template whose `when_expression` returns `true` wins. Its
`approval_template_approvers` groups feed the approval instance verbatim.

### 3.2 Config-level default selector

If no template matches, the resolver falls back to
`config('access.requests.default_approvers_selector')` — default value is
`role(admin)`. The selector runs through the same
`symfony/expression-language`-backed engine `workflow/approvals` uses (see
§5 of the design spec). This gives every tenant a working access-request flow
on day 1 — no template configuration required.

### 3.3 Resource-owner fallback

If steps 1 and 2 produce an empty set (config sets
`fallback_to_resource_owner: true`), the resolver reaches for the resource's
`created_by` user and adds them as a lone approver. This protects against a
tenant where the admin role is empty (unusual but possible during migration).
If that fallback ALSO produces nobody, the request is rejected at
creation time with `INVALID_APPROVER_CONFIGURATION` (500 severity — this is
platform-side misconfiguration that ops must fix).

### 3.4 OOF-awareness

Delegated approvers (from `access/delegation`) flow through automatically —
the approver-selector engine consults `role_delegations` at resolve time.
See §7 of the design spec.

## 4. Registering a requestable resource type

For a resource type to appear in the 403-response enrichment (§2.1) AND be
valid as `resource_type` in `POST /api/v1/access-requests` (§2.3), the
owning model must be marked `#[AccessRequestable]`:

```php
use Academorix\AccessRequest\Attributes\AccessRequestable;
use Academorix\Foundation\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

#[AccessRequestable(
    resourceType: 'invoice',
    permissions: ['invoices.view', 'invoices.update', 'invoices.export'],
)]
final class Invoice extends Model
{
    use HasUlids;
    // …
}
```

At boot time `AccessRequestableRegistry` scans every model composing the
attribute and populates a `Map<resourceType, RequestableConfig>` used by:

- The `access.request_hint_on_denial` middleware — to decide whether to append
  the `request_url` to a 403.
- The `valid_requestable_resource` validation rule — to accept or reject a
  submitted `resource_type` string.
- The `permission_belongs_to_resource_type` validation rule — to accept only
  permission names the model advertises.

The registry is snapshotted into a cache key
(`access-requests:requestable-registry`) on boot; a `config:cache` clear
refreshes it.

**Optional `IsAccessRequestable` trait.** Some policy authors prefer marking
requestability by trait composition rather than PHP attribute — the trait is
a marker with no behaviour, and boot-time discovery accepts either signal.
Composition-example is documented in `traits.json`.

## 5. Public surface

### Tenant host (authenticated, `sanctum` guard)

| Method + path                                            | Policy                             |
| -------------------------------------------------------- | ---------------------------------- |
| `POST /api/v1/access-requests`                           | `AccessRequestPolicy@create`       |
| `GET /api/v1/access-requests`                            | `AccessRequestPolicy@viewAny`      |
| `GET /api/v1/access-requests/{id}`                       | `AccessRequestPolicy@view`         |
| `POST /api/v1/access-requests/{id}/withdraw`             | `AccessRequestPolicy@withdraw`     |
| `GET /api/v1/access-requests/pending-my-review`          | `AccessRequestPolicy@viewAny`      |
| `POST /api/v1/access-requests/{id}/approve`              | `AccessRequestPolicy@approve`      |
| `POST /api/v1/access-requests/{id}/reject`               | `AccessRequestPolicy@reject`       |

### Platform-admin host (`platform_admin` guard)

Read-only cross-tenant compliance surface. Never approves or rejects — those
are always tenant-plane decisions authored by tenant users, not Academorix
staff.

| Method + path                                                     |
| ----------------------------------------------------------------- |
| `GET /api/v1/platform/access-requests`                            |
| `GET /api/v1/platform/access-requests/{id}`                       |
| `GET /api/v1/platform/access-requests/audit-report`               |

Full route table with query params + response shapes in `routes.json`.

## 6. Config vs settings vs entitlements — where does what live

- **`config('access.requests.*')`** — developer / operator flags: default
  grant TTL, default approver selector, resource-owner fallback toggle,
  reminder cadence, expiration hours, UI flag. Mirrored from
  `config/access-requests.php`. Static per deploy. See `config.json`.
- **Tenant settings** — this module does NOT ship a tenant-editable settings
  screen of its own. Approver flow is configured via the
  `workflow/approvals` template UI (the tenant admin writes an
  `approval_template` for `action_key='access.grants.create'`, and that's it).
  Grant TTL is configurable via `access/grants` tenant settings, not here.
- **Entitlements** — three keys (`access_requests` boolean feature,
  `access_request_reminders` medium+, `access_request_bulk_approve`
  enterprise). See `entitlements.json`. Enforced at the write path.

## 7. Non-goals

- **No local state.** No tables. Every deleted-once-approved rowset is
  materialised elsewhere (`workflow/approvals` for the request,
  `access/grants` for the outcome).
- **No approval template management here.** Belongs to `workflow/approvals`.
  This module registers `action_key='access.grants.create'` as an approvable
  action and stops there.
- **No cross-tenant requests.** Resource must be in the caller's active
  tenant. Enforced by the `resource_in_caller_tenant` rule at write time.
- **No auto-approval.** Every request goes through an approver. A config
  toggle exists (`access.requests.auto_approve_when_no_approvers=true`) but
  defaults OFF — enabling it in production requires an explicit design
  review because it silently bypasses the entire approval story.
- **No escalation flow in Wave 1b.** Reminders yes (nightly nudge to
  pending-decision approvers), but "escalate to the requester's manager if
  no answer in 48h" is deferred to Wave 2.
- **No bulk-request UI.** One resource per POST. Bulk approve (approver-side)
  is enterprise entitlement only.

## 8. Data model — no owned tables

`relations.json` documents the cross-module relations this module reads +
writes (never owns). Callers who need the "access request" object interact
with the `AccessRequest` DTO which projects across `workflow/approvals` +
`access/grants`.

## 9. What this module DOES contribute

Even without owning tables, the module is a substantial contributor:

| Kind          | Count | Where                    |
| ------------- | ----- | ------------------------ |
| Actions       | 1     | `CreateAccessRequestAction` marked `#[AsApprovableAction]` |
| Middleware    | 1     | `access.request_hint_on_denial` — response decorator       |
| Attributes    | 2     | `#[AccessRequestable]`, `#[AsAccessRequestListener]`       |
| Traits        | 1     | `IsAccessRequestable` (marker; optional alternative)       |
| Events        | 7     | Submit / approved / rejected / expired / cancelled / approver-notified / grant-issued |
| Listeners     | 4     | Bridge to `workflow/approvals` lifecycle events            |
| Jobs          | 3     | Approver notification, requester notification, orphan cleanup |
| Notifications | 5     | Submitted, approved, rejected, expired, reminder           |
| Rules         | 4     | resource validity + tenant scope + permission validity + reason length |
| Commands      | 6     | list / describe / approve / reject / cleanup / audit-report |
| DTOs          | ~7    | Request / Approve / Reject / Withdraw / Response shapes    |
| Bindings      | 6     | Submitter / ApproverResolver / Registry / UrlBuilder / GrantMaterializer / Presenter |

## 10. Flow map (cross-module event chain)

Because this module is a bridge, the flow map is more important than the
model diagram. Every arrow crosses a module boundary.

```
User → 403 (RBAC, from access/rbac)
        │
        └─► access.request_hint_on_denial (THIS MODULE)
                enriches 403 body with request_url

User → POST /access-requests
        │
        └─► CreateAccessRequestAction (THIS MODULE)
                validates via valid_requestable_resource,
                             resource_in_caller_tenant,
                             permission_belongs_to_resource_type,
                             valid_reason_length rules
                │
                └─► approve middleware (from workflow/approvals)
                     reads #[AsApprovableAction('access.grants.create')]
                     │
                     └─► ApprovalTemplateResolver + ApproverSelector
                          (THIS MODULE's AccessRequestApproverResolver
                          is registered as a plug-in selector)
                          │
                          └─► approval_instance created
                          └─► approval_requirements created
                          └─► ApprovalRequested event fires
                               │
                               ├─► NotifyApproversJob (THIS MODULE)
                               │    ├─► AccessRequestSubmittedNotification
                               │    │    → each approver via mail + db
                               │    └─► AccessRequestApproverNotified event
                               │        → analytics only
                               │
                               └─► AccessRequestSubmitted event
                                   (THIS MODULE's shim)

Approver → POST /access-requests/{id}/approve
        │
        └─► Delegates to workflow/approvals::ApproverDecisionAction
                which records approval_decision + evaluates quorum
                │
                └─► if quorum satisfied for all requirements:
                     instance.status → approved
                     ApprovalExecuted event fires
                     │
                     └─► AccessRequestGrantMaterializer (THIS MODULE)
                          filters ApprovalExecuted by
                          action_key === 'access.grants.create'
                          │
                          └─► access/grants::GrantIssuer::issue()
                               │
                               └─► access_grants row written
                                   with source='access_request',
                                        source_reference=<instance_id>
                                   GrantIssued event fires (from access/grants)
                     │
                     └─► AccessRequestApproved event (THIS MODULE)
                     │    │
                     │    └─► NotifyRequesterOfDecisionJob
                     │         │
                     │         └─► AccessRequestApprovedNotification
                     │              → requester via mail + db
                     │
                     └─► AccessRequestGrantIssued event (THIS MODULE)
                          → analytics + audit trail

Rejection path:
Approver → POST /access-requests/{id}/reject
        │
        └─► workflow/approvals::ApproverDecisionAction
             requirement.status → failed, instance.status → rejected
             ApprovalRejected event fires
             │
             └─► AccessRequestRejected event (THIS MODULE)
                  │
                  └─► NotifyRequesterOfDecisionJob → rejected notification

Expiry path:
Scheduler → workflow/approvals::ApprovalTimeoutCommand
        instance.status → expired (default) OR rejected OR escalated per template
        ApprovalExpired event fires
        │
        └─► AccessRequestExpired event (THIS MODULE)

Withdrawal path:
Requester → POST /access-requests/{id}/withdraw
        │
        └─► workflow/approvals::withdraw endpoint
             instance.status → cancelled
             ApprovalCancelled event fires
             │
             └─► AccessRequestCancelled event (THIS MODULE)

Cleanup path (scheduled daily):
Scheduler → access-requests:cleanup-orphaned command
        Scans approval_instances where action_key='access.grants.create'
        and subject_id no longer resolves to a live row
        (resource was deleted between submit and decision)
        → auto-rejects with reason='resource_no_longer_exists'
        → AccessRequestRejected event → requester notified
```

## 11. Terminology

- **Access request** — the whole DTO (`AccessRequest`) — a projection over
  `workflow/approvals.approval_instance` + `context_json` + the resulting
  `access_grant` when it exists.
- **Approval instance** — the underlying row in
  `workflow/approvals.approval_instances`. When you address an access
  request by id, you're addressing the approval instance.
- **Approver** — a User in the resolved set for a requirement on the
  underlying approval instance.
- **Requester** — the User whose `POST /access-requests` created the
  approval instance. `approval_instance.requester_id`.
- **Requestable resource** — a model marked `#[AccessRequestable]` (or
  composing `IsAccessRequestable`) whose class + permissions are registered
  in the `AccessRequestableRegistry`.
- **Materialised grant** — the row in `access/grants.access_grants` that
  results from the `ApprovalExecuted` listener.
- **Request URL** — the tenant-scoped URL the SPA POSTs to
  (`/api/v1/access-requests`). Advertised in every 403 body for requestable
  resource types.

## 12. Depends on

- `foundation` — traits, health, primitives.
- `compliance` — GDPR audit trail bookkeeping.
- `identity` — user identities + application resolution.
- `user` — the User model that both requesters and approvers resolve to.
- `application` — `X-Application-Id` middleware + hard-scoping.
- `tenancy` — tenant resolution + `TenantMember` check that the requester
  can even see the target resource's tenant.
- `access/rbac` — the RBAC gate whose 403s we enrich.
- `access/grants` — the module that owns the outcome. We call
  `GrantIssuer::issue()` on approval; we never write `access_grants` rows
  directly.
- `workflow/approvals` — the engine that owns the request state, approvals,
  quorum, expiry, and templates. We are its most opinionated consumer.
- `notifications` — the transport for approver + requester messages.

## 13. Depended on by

Every module that decorates a `#[AccessRequestable]` class:

- `billing` — invoices, refunds, subscriptions.
- `sports` — athletes, events, sessions.
- `teams` — teams, rosters.
- `facilities` — facilities, bookings.
- `region`, `organization` — structural resources.
- (Every future business domain that wants Google-Docs UX out of the box.)

Modules do NOT re-declare or fork the access-request flow — they just add the
attribute. This module's whole reason to exist is to keep that surface
identical everywhere.

## 14. Blueprint layout (this folder)

Standard shape — smaller than most modules because there are no tables.

```
modules/access/blueprints/requests/
├── module.json / readme.md / changelog.md
├── schemas/
│   └── access-request-projection.schema.json   (DTO shape, NOT a table)
├── relations.json  (cross-module references — nothing owned)
├── traits.json  (IsAccessRequestable marker only)
├── attributes.json  (#[AccessRequestable], #[AsAccessRequestListener])
├── routes.json
├── middleware.json
├── events.json / listeners.json / observers.json / hooks.json
├── jobs.json / schedule.json / commands.json
├── notifications.json / broadcasts.json
├── policies.json / permissions.json
├── features.json / entitlements.json / feature-flags.json
├── health.json / metrics.json / analytics.json
├── caches.json / retention.json
├── compliance.json / data-classes.json
├── errors.json / rules.json
├── config.json  (no settings.json — nothing tenant-editable here)
├── data/
│   └── access-requests.json  (sample projections for local dev)
└── sdui/
    ├── readme.md
    ├── resources/access-request/{list,create,show}.screen.json
    ├── screens/access-denied.screen.json
    └── widgets/access-request-status-chip.widget.json
```
