# Access + Approvals — Design Specification

**Status:** Locked. **Owner tiers:** `modules/access/`, `modules/workflow/`.
**Depends on:** `identity/user`, `identity/auth`, `platform/tenancy`,
`platform/application`. **Consumed by:** every module that authorises or gates
actions.

## 1. Overview

Wave 1b ships five modules across two tiers. `access/*` owns everything about
"who can do what" and "who has been granted what". `workflow/approvals/` owns
the multi-party approval engine.

| Module                | Priority | Tier                | Owns                                                                                                                                    |
| --------------------- | -------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `access/rbac/`        | 30       | access              | Runtime role + permission tables (spatie-permission extended with app + tenant scope), CRUD APIs, custom roles per tenant, policy layer |
| `access/grants/`      | 32       | access              | Per-resource dynamic grants ("Alice grants Bob edit on invoice #123 until Friday"). Overlay above RBAC                                  |
| `access/delegation/`  | 33       | access              | Time-bounded role delegation + real-time impersonation for support agents. Consumed by approver selector for OOF awareness              |
| `access/requests/`    | 34       | access              | Google-Docs-style access-request workflow. Wraps `workflow/approvals` with resource-type = `access_grant`                               |
| `workflow/approvals/` | 35       | workflow (new tier) | Generic multi-party approval engine on polymorphic subjects. Rule engine + template store + approver selectors + quorum + escalation    |

## 2. Locked design decisions

### D-A1 — Framework/business split

**`backend-packages/authorization/`** owns the FRAMEWORK primitives (PHP
attributes, guard base classes, discovery, contract interfaces). Already exists.

**`modules/access/*`** owns BUSINESS data (roles, permissions, grants,
delegations). Multi-tier, per-tenant.

Never conflate. Every module imports `#[RequirePermission]` from
`authorization`; only modules with an admin surface depend on `access/rbac` for
storage + CRUD.

### D-A2 — Roles extend spatie-permission with (application_id, tenant_id)

Reuse spatie/laravel-permission's tables + traits. Extend with:

- `roles.application_id` — nullable (null = platform_admin guard)
- `roles.tenant_id` — nullable (null = system/shipped role)
- `roles.is_system` — bool (immutable via observer)
- `permissions.application_id` — same
- `permissions.tenant_id` — same

`(application_id, tenant_id, name, guard_name)` composite unique. Guard mismatch
on write → `GuardMismatch` (422). Application mismatch → `ApplicationMismatch`.

### D-A3 — Grants overlay above RBAC (union with deny-priority)

Effective permission on a resource = RBAC ∪ grants − denies.

Order of resolution at `Gate::allows($user, $permission, $resource)`:

1. **Explicit deny grants** → return false immediately (deny wins)
2. **Explicit allow grants** for this resource → return true
3. **RBAC roles** on the user → return true if any role holds the permission
4. **Delegation** — if user is a delegate, evaluate as the delegator
5. **Default deny**

### D-A4 — Approval templates are runtime data (never code)

Approval flows are configured by tenant admins via UI, stored in DB, evaluated
by a rule engine at request time. Code declares which actions are _approvable_
via `#[AsApprovableAction(key: '...')]` + `ApprovableActionInterface`. Code
never declares templates or rules.

### D-A5 — Approval middleware, not trait

The approval check runs as HTTP middleware, not as a trait. `approve` middleware
attached to the route reads the target action's `#[AsApprovableAction]`
attribute, looks up templates for `(tenant, action_key)`, evaluates the rule
engine, and either passes through or defers execution.

### D-A6 — Rule engine = `symfony/expression-language`

Battle-tested, cache-compilable, sandbox-friendly, custom-function-extensible.
Not JSON Logic (weaker grammar), not a custom DSL (yak shave).

### D-A7 — Approver-groups model = separate table

`approval_template_approvers` normalized table (not JSON column). A template can
require multiple approver groups; each group has its own selector + quorum.
Instance-level composition tracked via `approval_requirements` rows.

## 3. Data model

### `access/rbac/` — spatie-extended tables

**`roles`** (extends spatie schema):

| Column             | Type   | Notes                                          |
| ------------------ | ------ | ---------------------------------------------- |
| `id`               | uuid   | prefixed `rol_`                                |
| `application_id`   | uuid   | FK applications.id, nullable (null = platform) |
| `tenant_id`        | uuid   | FK tenants.id, nullable (null = system role)   |
| `name`             | string | spatie's — `manager`, `coach`, etc.            |
| `guard_name`       | string | `sanctum` \| `platform_admin`                  |
| `is_system`        | bool   | immutable via observer                         |
| `description`      | text   | admin-facing                                   |
| `sort_order`       | int    | UI ordering                                    |
| audit + timestamps |        |                                                |

`UNIQUE(application_id, tenant_id, name, guard_name)`.

**`permissions`** — same shape as `roles` with same composite unique.

**`role_has_permissions`** — spatie's pivot, unchanged.

**`model_has_roles`** — spatie's, with `application_id + tenant_id` also on each
pivot row for query-plan efficiency.

**`model_has_permissions`** — spatie's, same augmentation.

**`role_definitions`** — Stackra metadata layer:

| Column                | Type   | Notes                                                     |
| --------------------- | ------ | --------------------------------------------------------- |
| `id`                  | uuid   | prefixed `rdf_`                                           |
| `role_id`             | uuid   | FK roles.id                                               |
| `business_type_slugs` | jsonb  | array — which business types default-provision this role  |
| `label_i18n`          | jsonb  | `{en: '...', ar: '...'}`                                  |
| `description_i18n`    | jsonb  | same                                                      |
| `default_permissions` | jsonb  | array of permission names — seeded on tenant provisioning |
| `min_tier`            | string | `small` / `medium` / `enterprise` — tier gate             |
| audit + timestamps    |        |                                                           |

### `access/grants/` — per-resource dynamic access

**`access_grants`**:

| Column             | Type        | Notes                                               |
| ------------------ | ----------- | --------------------------------------------------- |
| `id`               | uuid        | prefixed `agr_`                                     |
| `tenant_id`        | uuid        | FK tenants.id, CASCADE                              |
| `subject_type`     | string      | polymorphic — usually `User`                        |
| `subject_id`       | uuid        | polymorphic id                                      |
| `resource_type`    | string      | polymorphic — `Invoice`, `Athlete`, etc.            |
| `resource_id`      | uuid        | polymorphic id                                      |
| `permissions`      | jsonb       | array of permission names scoped to this resource   |
| `decision`         | enum        | `allow` \| `deny` (deny wins over role permissions) |
| `granted_by`       | uuid        | FK users.id                                         |
| `granted_at`       | timestamptz |                                                     |
| `expires_at`       | timestamptz | nullable (permanent if null)                        |
| `revoked_at`       | timestamptz | nullable                                            |
| `revoked_by`       | uuid        | FK users.id, nullable                               |
| `reason`           | text        | operator note                                       |
| audit + timestamps |             |                                                     |

Indexed on `(tenant_id, subject_type, subject_id, resource_type, resource_id)`
for the hot-path lookup.

### `access/delegation/` — role delegation + impersonation

**`role_delegations`**:

| Column             | Type        | Notes                                                     |
| ------------------ | ----------- | --------------------------------------------------------- |
| `id`               | uuid        | prefixed `dlg_`                                           |
| `tenant_id`        | uuid        | FK tenants.id, CASCADE                                    |
| `delegator_id`     | uuid        | FK users.id — who's handing over                          |
| `delegate_id`      | uuid        | FK users.id — who's receiving                             |
| `role_id`          | uuid        | FK roles.id, nullable — null = all-roles delegation (OOF) |
| `starts_at`        | timestamptz |                                                           |
| `ends_at`          | timestamptz |                                                           |
| `revoked_at`       | timestamptz | nullable                                                  |
| `reason`           | text        | required, audited                                         |
| audit + timestamps |             |                                                           |

**`impersonation_sessions`** — real-time act-as, distinct from role delegation:

| Column               | Type        | Notes                                          |
| -------------------- | ----------- | ---------------------------------------------- |
| `id`                 | uuid        | prefixed `imp_`                                |
| `impersonator_id`    | uuid        | FK platform_users.id — usually a support agent |
| `impersonated_id`    | uuid        | FK users.id — the target                       |
| `application_id`     | uuid        | FK applications.id                             |
| `tenant_id`          | uuid        | FK tenants.id                                  |
| `reason`             | text        | required                                       |
| `session_token_hash` | text        | short-lived (max 60 minutes)                   |
| `started_at`         | timestamptz |                                                |
| `ended_at`           | timestamptz | nullable                                       |
| `revoked_at`         | timestamptz | nullable                                       |
| audit + timestamps   |             |                                                |

Hard-audited. Every impersonation write is flagged in the audit stream with BOTH
impersonator + impersonated. Read-only sessions supported (opt-in).

### `access/requests/` — Google-Docs-style access request

Thin wrapper — creates a `workflow/approvals` instance with
`subject_type = 'access_request'` and the payload encoding
`{ resource_type, resource_id, permissions_wanted, reason }`. On approve,
creates a matching `access_grants` row.

No dedicated table. State lives in `workflow/approvals` tables.

### `workflow/approvals/` — the approval engine

**`approvable_actions`** — registry populated by boot-time discovery from
`#[AsApprovableAction]`:

| Column                | Type   | Notes                                                                       |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| `id`                  | uuid   | prefixed `apa_`                                                             |
| `key`                 | string | stable dot-separated identifier — `billing.invoices.refund`                 |
| `label`               | string | admin-facing display name                                                   |
| `description`         | text   | operator-facing                                                             |
| `context_schema_json` | jsonb  | JSON Schema of the action's approval context — powers admin UI rule builder |
| `default_selector`    | string | starter approver selector expression                                        |
| `is_enabled`          | bool   | platform-level enable                                                       |
| audit + timestamps    |        |                                                                             |

`UNIQUE(key)`. Populated by seeder from `#[AsApprovableAction]` discovery on
every deploy.

**`approval_templates`** — tenant-configured:

| Column                | Type   | Notes                                                        |
| --------------------- | ------ | ------------------------------------------------------------ |
| `id`                  | uuid   | prefixed `apt_`                                              |
| `tenant_id`           | uuid   | FK tenants.id, CASCADE                                       |
| `action_key`          | string | FK approvable_actions.key, RESTRICT                          |
| `name`                | string | admin label — "Refunds over $500"                            |
| `when_expression`     | text   | ExpressionLanguage source — evaluated against action context |
| `enabled`             | bool   | admin toggle                                                 |
| `priority`            | int    | evaluation order (lower first)                               |
| `timeout_hours`       | int    | pending → decided or expired                                 |
| `on_timeout`          | enum   | `approve` \| `reject` \| `escalate`                          |
| `escalation_selector` | string | ExpressionLanguage expression to resolve escalation target   |
| audit + timestamps    |        |                                                              |

Composite `UNIQUE(tenant_id, action_key, name)`.

**`approval_template_approvers`** — approver groups per template:

| Column                | Type   | Notes                                               |
| --------------------- | ------ | --------------------------------------------------- |
| `id`                  | uuid   | prefixed `apg_`                                     |
| `template_id`         | uuid   | FK approval_templates.id, CASCADE                   |
| `selector_expression` | text   | ExpressionLanguage — e.g. `role('finance_manager')` |
| `quorum`              | string | `all` \| `1_of_n` \| `majority` \| `n_of_m`         |
| `n_of_m_count`        | int    | required only if quorum = n_of_m                    |
| `sort_order`          | int    | for sequential vs parallel; null = parallel         |
| audit + timestamps    |        |                                                     |

`sort_order` null → parallel evaluation (all groups can be satisfied
concurrently). Non-null → sequential (group with lowest sort_order first;
subsequent groups blocked until earlier ones satisfy).

**`approval_instances`** — one per action attempt:

| Column                  | Type        | Notes                                                                           |
| ----------------------- | ----------- | ------------------------------------------------------------------------------- |
| `id`                    | uuid        | prefixed `api_`                                                                 |
| `tenant_id`             | uuid        | FK tenants.id, CASCADE                                                          |
| `action_key`            | string      | matches approvable_actions.key                                                  |
| `requester_id`          | uuid        | FK users.id — the caller who attempted the action                               |
| `subject_type`          | string      | polymorphic — the resource being acted upon                                     |
| `subject_id`            | uuid        | polymorphic id, nullable                                                        |
| `context_json`          | jsonb       | immutable snapshot of the request payload + resolved principal at attempt time  |
| `label`                 | string      | human-readable — approver's inbox title                                         |
| `status`                | enum        | `pending` \| `approved` \| `rejected` \| `expired` \| `cancelled` \| `executed` |
| `requested_at`          | timestamptz |                                                                                 |
| `decided_at`            | timestamptz | nullable                                                                        |
| `expires_at`            | timestamptz | derived from template.timeout_hours                                             |
| `executed_at`           | timestamptz | nullable — set when deferred action runs                                        |
| `execution_result_json` | jsonb       | nullable — captured on execute                                                  |
| audit + timestamps      |             |                                                                                 |

**`approval_requirements`** — one per matching template per instance:

| Column                       | Type   | Notes                                                   |
| ---------------------------- | ------ | ------------------------------------------------------- |
| `id`                         | uuid   | prefixed `apr_`                                         |
| `instance_id`                | uuid   | FK approval_instances.id, CASCADE                       |
| `template_id`                | uuid   | FK approval_templates.id, RESTRICT                      |
| `approver_group_id`          | uuid   | FK approval_template_approvers.id, RESTRICT             |
| `approver_selector_snapshot` | text   | resolved expression (for audit)                         |
| `resolved_approvers`         | jsonb  | array of user_ids at instance creation time (OOF-aware) |
| `quorum`                     | string | copied from template                                    |
| `sort_order`                 | int    | copied from template, drives sequential ordering        |
| `status`                     | enum   | `pending` \| `blocked` \| `satisfied` \| `failed`       |
| audit + timestamps           |        |                                                         |

`blocked` = sequential prerequisite not yet satisfied. `pending` = ready for
decision. `satisfied` = quorum met.

**`approval_decisions`** — one per approver's decision:

| Column              | Type        | Notes                                             |
| ------------------- | ----------- | ------------------------------------------------- |
| `id`                | uuid        | prefixed `apd_`                                   |
| `requirement_id`    | uuid        | FK approval_requirements.id, CASCADE              |
| `approver_id`       | uuid        | FK users.id — the human who decided               |
| `delegated_from_id` | uuid        | FK users.id, nullable — if approver was delegated |
| `decision`          | enum        | `approve` \| `reject` \| `withdraw`               |
| `comment`           | text        | nullable                                          |
| `decided_at`        | timestamptz |                                                   |
| audit + timestamps  |             |                                                   |

**`approval_reminders`** — nudges before timeout:

| Column             | Type        | Notes                             |
| ------------------ | ----------- | --------------------------------- |
| `id`               | uuid        | prefixed `apn_`                   |
| `instance_id`      | uuid        | FK approval_instances.id, CASCADE |
| `sent_at`          | timestamptz |                                   |
| `reminder_type`    | enum        | `pre_timeout` \| `escalation`     |
| audit + timestamps |             |                                   |

## 4. The approval flow — end-to-end

### 4.1 Request time

```
POST /api/v1/refunds
  Headers: Authorization: Bearer <cashier PAT>
  Body: { invoice_id, amount_cents: 75000, reason: 'defective_product' }

Route stack:
  1. auth:sanctum
  2. tenant.resolve
  3. permission:refunds.create        (RBAC gate — RequirePermission middleware)
  4. approve                          (approval middleware)
  5. RefundInvoiceAction::__invoke   (the actual controller)

Middleware 4 (approve) does:
  1. Read target action's #[AsApprovableAction(key: 'billing.invoices.refund')]
  2. If no attribute → no-op, pass through
  3. Load approval_templates WHERE tenant_id = current AND action_key = 'billing.invoices.refund' AND enabled = true
  4. Call action.approvalContext(RefundData, Invoice) → snapshot
  5. For each template ordered by priority:
     - Evaluate template.when_expression against snapshot via ExpressionLanguage
     - If matches → mark template as applicable
  6. If no template matches → pass through to action
  7. If templates match:
     a. Create approval_instance with snapshot + label from action.approvalLabel()
     b. For each matched template, for each approver_group, create approval_requirement
     c. Resolve each requirement's selector_expression → list of user_ids (OOF-aware — pull delegated approvers)
     d. Persist resolved_approvers on requirement
     e. Set requirements with sort_order = 0 (or null) to status='pending'
     f. Set requirements with sort_order > 0 to status='blocked'
     g. Fire ApprovalRequested event
     h. Return 202 Accepted { status: 'pending', instance_id: 'api_...' }
```

Notifications module listens to `ApprovalRequested` → sends emails + in-app
notifications to `resolved_approvers[]`.

### 4.2 Approver decision

```
POST /api/v1/approval-instances/{id}/approve
  Body: { comment: 'confirmed defect via customer support' }

  1. Validates caller is in requirement.resolved_approvers[]
  2. Records approval_decision
  3. Recomputes requirement.status via quorum rule
     - '1_of_n': one approve → satisfied
     - 'all': every resolved_approver must approve
     - 'majority': ⌈n/2⌉ approves
     - 'n_of_m': at least n approves
  4. If requirement.status → 'satisfied':
     - Unblock next sort_order requirements (set 'blocked' → 'pending')
     - If ALL requirements satisfied → instance.status → 'approved'
  5. If instance.status → 'approved':
     - Fire ApprovalGranted event
```

### 4.3 Deferred execution

```
Listener: ApprovalGrantedListener
  On ApprovalGranted event:
    1. Load approval_instance + context_json
    2. Resolve action class from approvable_actions.key (registry lookup)
    3. Hydrate action args from context_json (reverse of approvalContext())
    4. Dispatch the action via container, bypassing the approve middleware
       (via a scoped flag on the instance's execution context)
    5. Capture result → update approval_instance.execution_result_json
    6. Set approval_instance.status → 'executed'
    7. Fire ApprovalExecuted event
    8. Notifications listener → notify requester
```

**Bypass mechanism.** The approve middleware checks a
`scoped('approvals.executing')` flag; when set to the current instance_id, it
passes through without checking templates again. Set at dispatch, cleared after.
Prevents infinite loops.

### 4.4 Rejection

```
POST /api/v1/approval-instances/{id}/reject
  Body: { comment: 'exceeds refund policy' }

  1. Records approval_decision with decision='reject'
  2. requirement.status → 'failed'
  3. instance.status → 'rejected'
  4. Fire ApprovalRejected event
  5. Notifications → notify requester
```

### 4.5 Timeout + escalation

```
Scheduled: ApprovalTimeoutCommand (runs every 5 minutes)

  1. Load approval_instances WHERE status='pending' AND expires_at < now()
  2. For each:
     Load matching approval_templates.on_timeout
     - 'approve' → treat as unanimous approve, transition to 'approved', trigger deferred execution
     - 'reject'  → transition to 'rejected'
     - 'escalate' → resolve escalation_selector → append new resolved_approvers[]
                   → reset expires_at (extend by template.timeout_hours / 2)
                   → fire ApprovalEscalated event
                   → notify escalation targets
```

### 4.6 Recall / withdraw

```
POST /api/v1/approval-instances/{id}/withdraw
  Requires: caller is the original requester
  Effect: instance.status → 'cancelled'; requirements all → 'failed'
```

## 5. Rule engine — `symfony/expression-language`

**Variables available in `when_expression`:**

Every key from the action's `approvalContext()` snapshot. Plus framework
built-ins:

- `requester` — the User attempting the action (id, role_names, tenant_id, …)
- `tenant` — the current Tenant
- `now` — server timestamp (rare — most rules should not be time-sensitive)

**Custom functions registered:**

```
role(name: string): bool
    → true if requester holds this role

permission(name: string): bool
    → true if requester holds this permission

manager_of(user): User|null
    → resolves user's manager via a manager_id chain on Profile

branch_of(user): Branch|null
    → resolves user's active branch

same_organization(a, b): bool
    → true if both users are in the same organization

amount_gte(value: numeric, currency: string): bool
    → currency-aware comparison

age_lte(dob: date, years: int): bool
    → true if dob places the person at or under years old
```

**Approver selector expressions** — same engine, different context:

```
role('finance_manager')
    → resolves to all users with 'finance_manager' role in current tenant

role('finance_manager') and branch_of(requester)
    → same branch as requester

manager_of(requester)
    → dynamic — user's manager

chain_up_to(role('cfo'))
    → walk the org tree from requester upward, stop at first CFO

permission('refunds.approve.high_value')
    → all users with this specific permission
```

**Caching.** Each template's compiled expression is cached in-process (Octane-
safe, invalidated on template update).

**Sandbox.** ExpressionLanguage's grammar is limited by design — no PHP
functions, no arbitrary code execution. Tenant admins cannot ship arbitrary
logic.

## 6. Access request flow (Google-Docs-style)

### 6.1 Denial with request hint

```
GET /api/v1/invoices/inv_01H...
  → 403 { error: 'access_denied', code: 'access_denied.can_request',
          request_url: '/api/v1/access-requests',
          resource: {type: 'invoice', id: 'inv_01H...'},
          permissions_wanted: ['invoices.view'] }
```

The frontend shows "Request access". Non-requestable resources return 403
without the `request_url`.

### 6.2 Request creation

```
POST /api/v1/access-requests
  Body: { resource_type: 'invoice', resource_id: 'inv_01H...',
          permissions_wanted: ['invoices.view'], reason: 'Working on X' }

Server:
  1. Verifies requester is in the same tenant as the resource
  2. Creates workflow/approvals instance with:
       action_key: 'access.grants.create'
       subject_type: 'invoice', subject_id: 'inv_01H...'
       context_json: { permissions_wanted, reason, resource_owner_hint }
  3. Resolves approver via default access-request selector:
       permission('access.grants.manage') on resource owner OR resource tenant admin
  4. Returns 202 { request_id, status: 'pending', approvers: [...] }
```

### 6.3 Approval → grant creation

```
Listener: AccessRequestApprovedListener
  On ApprovalExecuted event where action_key = 'access.grants.create':
    1. Loads approval_instance.context_json
    2. Creates access_grants row (subject = requester, resource = subject,
       permissions = permissions_wanted, expires_at = default TTL from tenant settings)
    3. Notifies requester
```

## 7. Delegation-aware approver resolution

`access/delegation` maintains active `role_delegations` rows. The approver
selector engine consults these on every resolution:

```
Selector: role('finance_manager')

Resolution:
  1. Fetch all users with 'finance_manager' role in current tenant
  2. For each such user, check for active role_delegations WHERE
     delegator_id = user_id AND role matches (or is null) AND now BETWEEN
     starts_at AND ends_at AND revoked_at IS NULL
  3. Replace each delegated user with their delegate in the resolved set
  4. Return the union (deduplicated)
```

**OOF flow example.** Alice (finance_manager) is on vacation and has delegated
all her roles to Bob for the week. A refund approval requiring
`role('finance_manager')` resolves to `[Bob]` instead of `[Alice]` for the
duration.

## 8. Cross-module dependencies

```
access/rbac  ────►  identity/user, platform/tenancy, platform/application,
                    entitlements
access/grants  ────►  access/rbac, identity/user
access/delegation  ────►  access/rbac, identity/user
access/requests  ────►  access/grants, workflow/approvals, notifications
workflow/approvals  ────►  identity/user, platform/tenancy, notifications
```

Domain modules depend on `access/rbac` for permission checks. Actions that
require approval decorate with `#[AsApprovableAction]` from
`workflow/approvals`.

## 9. Non-goals

- **No policy-as-code (OPA/Cerbos/Cedar).** Deferred. Symfony ExpressionLanguage
  is the pragmatic PHP-native choice for our monolith. If we go polyglot
  microservices in year 3, we reconsider.
- **No expression editor UI in Wave 1b.** Admins write expressions in a plain
  text field with docs. Visual builder is Wave 2.
- **No parallel-and-then-sequential composition of approval groups within a
  single template.** Groups are all parallel OR fully sequenced. Mixing requires
  two templates chained via a state machine — deferred.
- **No cross-tenant grants.** A user in tenant A cannot be granted access to a
  resource in tenant B, even by explicit invitation. The correct pattern is
  cross-app SSO to tenant B's own login.
- **No numerical scoring / weighted approvals in Wave 1b.** All approvals are
  binary (approve/reject). Weighted votes (e.g. senior manager = 2 votes)
  deferred.
- **No policy versioning.** Templates are edited in place; historical instances
  keep their snapshot in `context_json`, so past decisions remain reproducible.
  Versioning is Wave 2 if buyers ask.

## 10. Cross-references

- `.kiro/steering/hierarchy.md` §4 — Two-audience boundary (RBAC guard split)
- `.kiro/steering/php-attributes.md` §RBAC — `#[RequirePermission]` and friends
  (framework primitives)
- `.kiro/steering/tenancy-columns.md` §2 — `roles` + `permissions` carry
  `application_id` directly (two of the eight rows)
- Sibling spec: `.kiro/specs/identity/design.md` — Wave 1a
- Framework: `backend-packages/authorization/` — attributes + base classes
