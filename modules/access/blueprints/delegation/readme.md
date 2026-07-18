# delegation

Time-bounded role delegation + real-time impersonation sessions. Two
distinct-but-related concerns wrapped in one module because they share a single
conceptual axis — "actor X is temporarily allowed to act as actor Y" — and
consuming modules (RBAC's `PermissionResolver`, workflow/approvals' approver
selector, audit stream) hit them through the same `DelegationResolver`
interface.

## What this module owns

| Concern                                     | Owned artefact                                                                                                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Out-of-office / handover role delegation    | `RoleDelegation` (tenant User delegator + tenant User delegate + optional role + starts_at + ends_at + revoked_at + reason + delegation_type)                                |
| Real-time act-as sessions for support staff | `ImpersonationSession` (PlatformUser impersonator + tenant User impersonated + target application + target tenant + session_token_hash + ends_at + is_read_only + snapshots) |
| Delegation-aware approver resolution        | `DelegationResolver` service (used by RBAC + workflow/approvals — see access-approvals/design.md §7)                                                                         |
| Impersonation Sanctum PAT issuance bridge   | `ImpersonationSessionIssuer` (calls into identity/auth's `ImpersonateStartAction` — the start-point deferred from identity module per identity/design.md §12)                |
| Delegate context enforcement                | `delegation.enforce_delegate_context` middleware — flags the request with `active_delegation_id` in RequestContext when the caller acts as a delegator                       |
| Impersonation session enforcement           | `impersonation.enforce_active_session` + `impersonation.enforce_read_only` middleware                                                                                        |
| Bounded lifecycle                           | Scheduled `ActivateDelegationsJob` / `ExpireDelegationsJob` / `EndImpersonationSessionsJob` — moves rows through pending → active → expired without polling call-sites       |

### Why one module, two entities

The two concerns share:

- The vocabulary — both answer "who is currently allowed to act on behalf of
  whom".
- The consumer — RBAC + workflow/approvals hit `DelegationResolver` with a
  `(actor, resource_scope)` tuple; the resolver walks BOTH tables and returns
  the union.
- The audit stream — both write impersonator-plus-impersonated correlations into
  the audit stream that compliance later mines.

They differ in:

- The audience — role_delegations are tenant-plane peer-to-peer; impersonation
  is central-plane → tenant-plane.
- The lifetime — delegations max 90 days; impersonation max 60 minutes.
- The audit weight — impersonation is heavier (compliance evidence, 7-year hot
  retention); delegation is standard (2-year retention).
- The trust model — delegations are consensual (delegator initiates);
  impersonation is unilateral (support agent's tenant does not authorise each
  session — compensated by hard-audit + notify-target-cannot-opt-out).

Splitting them into two modules would (a) duplicate `DelegationResolver` since
consumers need both dimensions unified, (b) split `HasImpersonationHistory` away
from `HasDelegations` (both are traits on the User model), (c) confuse the
extension seam for future related concepts (session hijacking flags, break-glass
overrides). Keep them together; the schemas + observers + policies are cleanly
separated inside.

## Placement rationale

Sits at Wave 1b priority 33, after `access/rbac` (30) and `access/grants` (32)
and before `access/requests` (34) + `workflow/approvals` (35). Depends on
`platform-user` because impersonation FKs to `platform_users.id`; depends on
`access/rbac` because delegations reference role_id from the extended
spatie-permission `roles` table.

## Two entity contracts at a glance

| Model                  | Storage                        | Purpose                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `RoleDelegation`       | table `role_delegations`       | One row per delegation. Tenant-plane FKs (tenant, delegator, delegate, role). Soft-deleted. Composite unique `(tenant_id, delegator_id, delegate_id, role_id, starts_at) WHERE revoked_at IS NULL`. Hard 90-day window cap.                |
| `ImpersonationSession` | table `impersonation_sessions` | One row per session. Impersonator FK to platform_users (SET NULL on hard-delete + snapshot cols), impersonated FK to tenant users (CASCADE on Identity erasure). Hard 60-minute cap. NEVER soft-deleted (append-only compliance evidence). |

## Lifecycle diagrams

### Role delegation

```
                             ActivateDelegationsJob (hourly)
    ┌──────────► pending ────────────────────► active
    │                │                             │
  create             │                             │ ExpireDelegationsJob (hourly)
    │                │                             ▼
    │                └───► revoked (early)      expired ───┐
    │                       ▲                              │
    │                       │                              ▼
    └───────────────────────┴──────────────── purged (PurgeRevokedDelegationsJob after 730 d)
```

Every transition writes an `Activity` row via `HasActivityLog`. `pending`
delegations exist because a delegator can create a delegation with a future
`starts_at`; the row is not yet effective for `DelegationResolver` reads until
`ActivateDelegationsJob` runs and fires `DelegationActivated`.

### Impersonation session

```
                                     EndImpersonationSessionsJob (every 5 min)
     ┌────► started ───► active ──────────────────────► ttl_expired (terminal)
     │        │            │
     │        │            ├── self_service        ◄── operator POSTs /end
     │        │            │
   create     │            ├── admin_revocation    ◄── super_admin POSTs /force-terminate
     │        │            │
     │        │            └── security_lockdown   ◄── security team fires forced-terminate
     │        │                                        (heavy-audit + team notification)
     │        │
     │        └── refused    ◄── entitlement missing / cross-tenant / target disabled
     │                            fires ImpersonationAttemptRefused (no row created)
     ▼
   NEVER purged.
   session_token_hash NULLED after 30 days (PurgeImpersonationSessionsJob) —
   the row itself is preserved indefinitely (compliance evidence).
```

## The load-bearing invariants

### Delegation resolution — used by RBAC + workflow/approvals

```
IsCurrentlyDelegate($delegate_user, ?$role_id, $tenant_id, $application_id):
  SELECT rd.*
  FROM role_delegations rd
  WHERE rd.tenant_id = $tenant_id
    AND rd.delegate_id = $delegate_user->id
    AND (rd.role_id = $role_id OR rd.role_id IS NULL)
    AND rd.starts_at <= now()
    AND rd.ends_at   > now()
    AND rd.revoked_at IS NULL
    AND rd.deleted_at IS NULL
```

Consumers:

- **RBAC PermissionResolver** — after the standard role check fails, walks the
  caller's active delegations; if any delegation grants a role that holds the
  target permission, allows. Delegated permissions cannot exceed the delegator's
  own permissions at delegation-creation time (validated in
  `RoleDelegationObserver::creating`).
- **workflow/approvals approver selector** — when a selector expression like
  `role('finance_manager')` resolves, the engine finds every User with that
  role, then for each such delegator replaces them with their active delegate
  (deduplicated). The Google-Docs-style OOF flow: Alice's `finance_manager`
  approver requirement transparently resolves to Bob's inbox for the delegation
  window.

### Impersonation flow — five load-bearing invariants

1. **The impersonator's operating PAT during the session is a NEW PAT scoped to
   the impersonation.** Issued via identity/auth's
   `IssueImpersonationPatAction`, with abilities equal to the impersonated
   User's abilities (never the impersonator's own platform-admin abilities). On
   session end the PAT dies without invalidating the impersonator's regular
   platform-admin session.
2. **The impersonated User does NOT see their session as impersonated during the
   session.** They may see it retroactively via the
   `ImpersonationSessionStartedNotification` + `...EndedNotification` — both
   cannot-opt-out, per SOC 2 + PCI-DSS 8.5 mandated notice.
3. **Every write during impersonation is stamped with BOTH impersonator +
   impersonated.** The audit row's `actor_id` is the impersonated User; a
   separate `impersonated_by_platform_user_id` column carries the impersonator
   PlatformUser id + snapshot fields (impersonator_display_name +
   impersonator_department) so audit rows remain readable after PlatformUser
   hard-delete. Correlation id is stamped by `platform.audit` middleware on the
   impersonation-scope PAT's request-cycle.
4. **Read-only mode is enterprise-only.** `is_read_only=true` sessions cause the
   `impersonation.enforce_read_only` middleware to refuse every POST / PUT /
   PATCH / DELETE with `403 impersonation_read_only`. Some tenant contracts
   require this — see entitlements.json `read_only_impersonation`.
5. **Impersonation survives the impersonator's offboarding.** When a
   PlatformUser row hard-deletes at the end of its 90-day retention hold,
   `impersonator_platform_user_id` cascades to `NULL` (SET NULL) but
   `impersonator_display_name` + `impersonator_department` snapshot fields
   remain untouched (immutable via `ImpersonationSessionObserver::updating`
   refusing writes on snapshot cols). Compliance queries can still answer "who
   impersonated tenant X's users last quarter" against snapshot fields.

## Two-audience boundary

Every route lands under exactly one guard:

| Audience       | Guard            | Route prefix           | Entity                 | Notes                                                                                            |
| -------------- | ---------------- | ---------------------- | ---------------------- | ------------------------------------------------------------------------------------------------ |
| Tenant user    | `sanctum`        | `/api/v1/me/...`       | `RoleDelegation`       | A tenant user manages their own OOF delegations. Cross-tenant refused at observer.               |
| Platform admin | `platform_admin` | `/api/v1/platform/...` | `ImpersonationSession` | Support staff / security teams manage impersonation. Entitlement + MFA-mandatory pre-conditions. |

There is no crossover. A tenant User has no way to reach
`impersonation_sessions`; a PlatformUser has no way to reach `role_delegations`
(Academorix staff don't have OOF within a tenant they don't belong to).

## Public surface

### Tenant host (`sanctum` guard)

| Method + path                                | Policy                         | Purpose                                                        |
| -------------------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| `GET /api/v1/me/delegations`                 | `RoleDelegationPolicy@viewAny` | List caller's outbound + inbound delegations.                  |
| `POST /api/v1/me/delegations`                | `RoleDelegationPolicy@create`  | Delegator creates a new delegation.                            |
| `GET /api/v1/me/delegations/{delegation}`    | `RoleDelegationPolicy@view`    | Delegator, delegate, or admin.                                 |
| `DELETE /api/v1/me/delegations/{delegation}` | `RoleDelegationPolicy@revoke`  | Delegator or admin — revoke early.                             |
| `GET /api/v1/me/delegation-received`         | `RoleDelegationPolicy@viewAny` | Currently-active delegations where the caller is the delegate. |

### Platform-admin host (`platform_admin` guard)

| Method + path                                                   | Policy                                 | Purpose                                                                                                         |
| --------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/platform/impersonation/start`                     | `ImpersonationSessionPolicy@create`    | Composes identity/auth's `ImpersonateStartAction` — issues the PAT AND writes the session row atomically.       |
| `POST /api/v1/platform/impersonation/{session}/end`             | `ImpersonationSessionPolicy@terminate` | Impersonator OR super_admin OR security ends the session.                                                       |
| `GET /api/v1/platform/impersonation/sessions`                   | `ImpersonationSessionPolicy@viewAll`   | List active sessions (security + super_admin).                                                                  |
| `GET /api/v1/platform/impersonation/sessions/{session}`         | `ImpersonationSessionPolicy@view`      | Session detail.                                                                                                 |
| `GET /api/v1/platform/impersonation/audit`                      | `ImpersonationSessionPolicy@viewAll`   | Cross-tenant compliance report — the read primary for SOC 2 evidence review.                                    |
| `POST /api/v1/platform/impersonation/{session}/force-terminate` | `ImpersonationSessionPolicy@terminate` | Security lockdown — super_admin or security fires. Emits `ImpersonationSessionForcedTerminate` + security team. |

## The `HasDelegations` + `HasImpersonationHistory` traits

`HasDelegations` composes on the tenant `User` model. Adds:

```php
$user->activeDelegations()          // as delegator, currently active
$user->activeAsDelegate()           // as delegate, currently active
$user->allDelegations()             // full history (any state)
$user->delegate('bob@example.com', role: 'finance_manager', for: 5days, reason: '...')
$user->revokeDelegation($delegationId, reason: 'returned early')
```

`HasImpersonationHistory` composes on BOTH `User` + `PlatformUser`. On the User
side, exposes past sessions where they were impersonated. On the PlatformUser
side, past sessions where they were the impersonator. Snapshot fields survive
hard-delete of the platform_users row.

## Entitlements consumed

- `role_delegation` — role delegation available (all tiers)
- `emergency_delegation` — bypass min_advance_notice_hours (medium + enterprise)
- `impersonation` — a per-PlatformUser capability (Academorix-internal only —
  NOT a tenant entitlement; belongs to platform-user seed data)
- `read_only_impersonation` — is_read_only sessions available (enterprise)
- `impersonation_extended_ttl` — > 60 minute sessions available (enterprise,
  contract-negotiated only)

## Compliance

- **SOC 2 CC6.1 + CC6.7** — every impersonation session logged with actor,
  timestamp, reason, duration; audit trail preserved 7 years hot.
- **PCI-DSS 8.5** — MFA is required for impersonation start (inherited from the
  platform_admin guard's MFA-mandatory policy).
- **GDPR Art. 17** — impersonation records cascade on target User Identity
  erasure via CASCADE on `impersonated_user_id`; impersonator's actions retained
  per Art. 17(3)(e) (legal claims exception).
- **HIPAA** (future) — if a healthcare tenant adopts, impersonation of that
  tenant's users triggers additional audit requirements captured via
  `metadata.compliance_regime` on the session row.

## Retention

| Entity               | Hot   | Purge trigger                           |
| -------------------- | ----- | --------------------------------------- |
| RoleDelegation       | 730 d | `PurgeRevokedDelegationsJob` daily      |
| ImpersonationSession | 7 y   | Never purged; token_hash NULLED at 30 d |

## Contributions

- **Traits** — `HasDelegations`, `HasImpersonationHistory`.
- **Attributes** — `AsDelegationListener`, `AsImpersonationListener`.
- **Middleware** — `delegation.enforce_delegate_context`,
  `impersonation.enforce_active_session`, `impersonation.enforce_read_only`.
- **Events** — 5 delegation + 5 impersonation lifecycle events, all
  `ShouldDispatchAfterCommit`. `ImpersonationSessionStarted` +
  `ImpersonationSessionForcedTerminate` route to `notifications-critical` queue.
- **Policies** — `RoleDelegationPolicy` (sanctum) + `ImpersonationSessionPolicy`
  (platform_admin).
- **Permissions** — tenant plane:
  `delegations.viewAny / view / create / revoke`. Platform plane:
  `platform.impersonate / .view / .viewAll / .terminate / .audit`.
- **Rules** — `valid_delegation_window`, `delegator_holds_role`,
  `same_tenant_delegation`, `impersonation_ttl_within_bounds`,
  `impersonation_reason_min_length`.
- **Bindings** — `RoleDelegationRepository`, `ImpersonationSessionRepository`,
  `DelegationResolver`, `ImpersonationSessionIssuer`,
  `ImpersonationSessionTerminator`, `DelegationValidator`,
  `ImpersonationEntitlementChecker`.

## Depends on

- `foundation` — traits, primitives, HasActivityLog.
- `compliance` — audit-heavy trail infrastructure for impersonation.
- `identity` — Identity substrate (email + password + MFA) for auth handshake.
- `user` — tenant User model (delegator + delegate + impersonated).
- `platform-user` — PlatformUser model (impersonator).
- `tenancy` — tenant scoping.
- `application` — application scoping (delegations + impersonation both
  application-scoped via cascade through tenant).
- `entitlements` — impersonation feature gates.
- `access/rbac` — Role model referenced by role_delegations.role_id.

## Depended on by

- `workflow/approvals` — approver-selector engine walks role_delegations via
  `DelegationResolver` for OOF-aware approver resolution (see
  access-approvals/design.md §7).

## Terminology

- **Delegation** — the `RoleDelegation` record.
- **Delegator** — the User handing over their role (initiates the delegation).
- **Delegate** — the User receiving the delegation.
- **Delegation type** — `oof` (out-of-office, symmetric), `handover` (a
  longer-lived transition, e.g. Alice leaves the finance team and hands over to
  Bob), `emergency` (immediate + bypass min_advance_notice_hours).
- **Impersonation session** — the `ImpersonationSession` record.
- **Impersonator** — the PlatformUser starting the session (Academorix staff).
- **Impersonated** — the tenant User the impersonator acts as.
- **Session token** — the short-lived Sanctum PAT bound to the session. Its hash
  is `session_token_hash`; the raw PAT is only ever known to the impersonator's
  browser + returned once at session-start.
- **End trigger** — `self_service` (impersonator hit end), `ttl_expired`
  (session hit ends_at), `admin_revocation` (super_admin fired force-terminate),
  `security_lockdown` (security team lockdown).
- **Snapshot fields** — `impersonator_display_name` + `impersonator_department`
  — captured at session start and immutable thereafter, so compliance queries
  still resolve when the PlatformUser row is later hard-deleted.

## Blueprint layout (this folder)

Standard module blueprint shape. See `.kiro/specs/module-blueprints/PLAN.md` for
the full artefact contract.

```
modules/access/blueprints/delegation/
├── module.json / readme.md / changelog.md
├── schemas/
│   ├── role-delegation.schema.json
│   └── impersonation-session.schema.json
├── relations.json, traits.json, attributes.json
├── routes.json, middleware.json
├── events.json, listeners.json, observers.json, hooks.json, webhooks.json
├── jobs.json, schedule.json, commands.json
├── notifications.json, broadcasts.json
├── policies.json, permissions.json, features.json, feature-flags.json
├── entitlements.json, health.json, metrics.json, analytics.json
├── caches.json, retention.json, compliance.json, data-classes.json
├── errors.json, subprocessors.json, config.json, settings.json,
│   rules.json, helpers.json
├── data/{delegation-types,impersonation-end-triggers}.json
└── sdui/
    ├── resources/role-delegation/{list,create,show}.screen.json
    ├── resources/impersonation-session/{list,start,show,audit-report}.screen.json
    └── widgets/{delegation-status-chip,impersonation-active-banner,
        impersonation-countdown-timer,delegation-scope-badge}.widget.json
```
