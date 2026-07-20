# rbac

The runtime role + permission storage layer for the sanctum + platform_admin
guards. Wave 1b access-tier infrastructure, priority 30 — boots right after Wave
1a's `auth` (priority 25) so the resolver is available the moment auth starts
caching compact permission arrays on Sanctum PAT abilities.

## 1. What this module owns

| Concern                                          | Owned artefact                                                                                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Roles table (spatie-extended)                    | `roles` — augmented with `application_id`, `tenant_id`, `is_system`, `description`, `sort_order`                               |
| Permissions table (spatie-extended)              | `permissions` — same augmentation, dot-notated names with scope suffix                                                         |
| Role↔Permission pivot (spatie's, augmented)      | `role_has_permissions` — denormalised `application_id` + `tenant_id` for query-plan efficiency                                 |
| Principal↔Role pivot (spatie's, augmented)       | `model_has_roles` — polymorphic to `User` / `PlatformUser` / `ServiceAccount`, adds `assigned_by`, `assigned_at`, `expires_at` |
| Principal↔Permission pivot (spatie's, augmented) | `model_has_permissions` — direct permission grants (rare; usually roles carry perms)                                           |
| Metadata layer                                   | `role_definitions` — business_type default provisioning, i18n labels, min-tier gating, `default_permissions[]`                 |
| Permission resolver                              | `PermissionResolver::resolve($principal, $permission, ?$resource)` — the RBAC ∪ grants − denies + delegation composition       |
| Permission cache                                 | `PermissionCacheManager` — per-principal compact array, TTL 300s, invalidated on every role/permission/assignment mutation     |
| Role assignment service                          | `RoleAssignmentService::assign(...)` + `::revoke(...)` — enforces guard/application boundaries, time-bounded assignments       |
| Tenant default seeding                           | `TenantDefaultRoleSeeder` — on `TenantProvisioned`, seed roles based on business_type                                          |
| Permission catalogue discovery                   | `PermissionCatalogueLoader` — scans `#[ProvidesPermissions]` on service providers at boot                                      |
| Scope suffix validation                          | `ScopeSuffixValidator` — enforces `.own` / `.tenant` / `.branch` / `.team` / `.child` / `.any` on every new permission name    |
| HTTP CRUD surface                                | Tenant plane (`/api/v1/rbac/*`), platform plane (`/api/v1/platform/rbac/*`)                                                    |
| Enforcement middleware                           | `rbac.enforce_permission`, `rbac.enforce_role`, `rbac.warm_permission_cache`                                                   |

### 1.1 What this module explicitly does NOT own

- **Framework primitives.** `#[RequirePermission]`, `#[RequireRole]`, base guard
  classes, discovery scaffolding — those live in
  `backend-packages/authorization/`. The framework/business split is locked by
  design.md §2 D-A1. Every module imports `#[RequirePermission]` from the
  framework package; only this module owns the storage.
- **Grants + denies.** Per-resource dynamic grants (Alice grants Bob edit on
  invoice #123 until Friday) live in `access/grants` (priority 32). This module
  knows the resolver has to consult them via `GrantResolverInterface` — the
  concrete implementation lives in the grants module.
- **Delegation.** Time-bounded role delegation + real-time impersonation session
  storage live in `access/delegation` (priority 33). The resolver consults
  `DelegationResolverInterface` to evaluate the delegator's permissions when the
  caller is a delegate.
- **Access requests.** Google-Docs-style access-request workflow lives in
  `access/requests` (priority 34), which wraps `workflow/approvals`.
- **Approval workflows.** Multi-party approvals live in `workflow/approvals`
  (priority 35).
- **Domain permission strings.** This module ships the SEED catalogue (rbac._,
  roles._, permissions._) — every downstream module ships its OWN
  `permissions.json` extending the catalogue (users._, invoices._, athletes._,
  ...). Discovery via `#[ProvidesPermissions]` at boot.
- **Role assignment approvals.** Assigning a role that grants sensitive
  permissions may require approval via `workflow/approvals` — that wiring is on
  the assignment action's `#[AsApprovableAction]`, not here.

## 2. The four-principal architecture

RBAC binds polymorphically to three principal types from Wave 1a's identity
spec, plus one composed identity:

| Principal             | Guard            | Tenancy?               | Application binding                          | Notes                                                 |
| --------------------- | ---------------- | ---------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `User`                | `sanctum`        | tenant-scoped          | per-Application (via `users.application_id`) | The per-Application projection of an Identity         |
| `PlatformUser`        | `platform_admin` | cross-tenant           | cross-Application                            | Academorix staff — support, security, compliance      |
| `ServiceAccount`      | `sanctum`        | tenant-scoped OR cross | per-Application OR cross                     | Machine credentials for inter-service calls           |
| `Identity` (indirect) | n/a              | n/a                    | n/a                                          | Never holds roles directly — Users on the Identity do |

`model_has_roles` and `model_has_permissions` are polymorphic on
`(model_type, model_id)` so a single row shape covers every principal. The
observer enforces:

- `User` rows can only bind roles where
  `roles.application_id = user.application_id`
- `PlatformUser` rows can only bind roles where
  `roles.guard_name = 'platform_admin'`
- `ServiceAccount` rows can only bind roles where the guard + application match
  the service account's own record

## 3. The permission resolver — the heart of RBAC

`PermissionResolver::resolve($principal, string $permission, ?Resource $resource = null): bool`
is the single entry point for every permission check in the codebase.

Algorithm (per design.md §2 D-A3):

```
1. Load principal's ResolvedPermissionSet
   1a. Try cache: rbac:permissions:{principal_type}:{principal_id}:{application_id}:{tenant_id}
   1b. On miss: enumerate RBAC roles → walk role_has_permissions → merge direct model_has_permissions
   1c. Cache the compact array with TTL 300s

2. If $resource is set:
   2a. Explicit DENY grants on ($principal, $resource) → return false immediately (deny wins)
   2b. Explicit ALLOW grants on ($principal, $resource) → return true

3. RBAC layer: if $permission in ResolvedPermissionSet → return true

4. Delegation: if $principal is a delegate for the current tenant + role,
   evaluate resolve($delegator, $permission, $resource) → return that result

5. Return false (default deny)
```

**Cache invalidation strategy.** The compact array cache is invalidated by:

- `RoleAssignedToPrincipal(principal_id: X)` → purge `rbac:permissions:X:*`
- `RoleRevokedFromPrincipal(principal_id: X)` → same
- `PermissionGrantedToPrincipal(principal_id: X)` /
  `PermissionRevokedFromPrincipal` → same
- `PermissionsAttachedToRole(role_id: R)` / `PermissionsDetachedFromRole` →
  enumerate every principal in `model_has_roles WHERE role_id = R` + purge each
- `RoleAssignmentExpired(principal_id: X)` → same as revoke
- Bulk cases (e.g. seeder re-runs) → `InvalidatePermissionCacheJob` purges tags
  in batches to avoid blocking on a giant `KEYS` scan

**Cache key shape.**
`rbac:permissions:{principal_type}:{principal_id}:{application_id}:{tenant_id}`.
The `application_id` + `tenant_id` are load-bearing — the same Identity's `User`
on App A resolves to a different permission set than the SAME Identity's `User`
on App B, and the caches must not collide.

## 4. Guard boundary enforcement

The two-audience boundary from `.kiro/steering/hierarchy.md` §4 is a HARD rule
at write-time:

- Every `role` row carries a `guard_name` ∈ {`sanctum`, `platform_admin`}
- Every `permission` row carries the same
- Every `role_has_permissions` row must satisfy
  `role.guard_name === permission.guard_name` (enforced by
  `RoleHasPermissionsObserver`)
- Every `model_has_roles` row must satisfy
  `role.guard_name === principal.guard_name` (enforced by
  `ModelHasRolesObserver`)

Cross-guard writes raise `GuardMismatch` (422). Cross-Application writes raise
`ApplicationMismatch` (422). Both are compliance-audited (SOC 2 CC6.3 boundary
violation).

## 5. System roles vs custom roles

**System roles** (`is_system = true`) are shipped by Academorix and provisioned
per business_type on `TenantProvisioned`. Examples:

- Sports academy: `owner`, `admin`, `head_coach`, `coach`, `receptionist`,
  `medical`, `athlete`, `parent`
- Fitness gym: `owner`, `admin`, `trainer`, `receptionist`, `member`
- School: `owner`, `admin`, `principal`, `teacher`, `student`, `parent`,
  `receptionist`
- Federation: `owner`, `admin`, `federation_officer`, `federation_referee`
- Platform admin: `super_admin`, `security`, `support`, `compliance`, `product`,
  `ops`

System roles are IMMUTABLE via observer — attempts to rename, delete, or modify
their permission set raise `SystemRoleModificationRefused` (critical-severity
event). The one legal mutation is attaching / detaching CUSTOM permissions
(permissions the tenant created) — which requires the `custom_permissions`
entitlement (Enterprise).

**Custom roles** are tenant-created (owner / admin only), gated by the
`custom_roles` entitlement (Medium tier and up) + `custom_role_slot` quota.
Tenants on Small tier can't create custom roles at all — they work with the
system role set.

## 6. Time-bounded role assignments

`model_has_roles.expires_at` enables temporary role grants. Consumed by:

- **`access/delegation`** — when Alice delegates all her roles to Bob for the
  week, delegation creates `model_has_roles` rows with
  `expires_at = week_from_now`.
- **Onboarding flows** — a new coach can be granted `head_coach` for the first
  30 days as they train up.
- **Investigation flows** — platform support can be granted temporary read-only
  access for an incident.

`PurgeExpiredRoleAssignmentsJob` runs hourly and fires `RoleAssignmentExpired`
for each purged row — the listener invalidates the affected principal's
permission cache + notifies the principal.

Requires the `time_bounded_role_assignments` entitlement (Medium+). On Small
tier, `expires_at` writes are refused at the observer layer.

## 7. The `role_definitions` metadata layer

Distinct from spatie's `roles` table. `role_definitions` holds the Academorix
metadata that spatie doesn't model:

- `business_type_slugs` — which business_types default-provision this role
  (`["academy", "school"]` for `head_coach`, etc.)
- `label_i18n` / `description_i18n` — bilingual labels for admin UI
- `default_permissions` — the compact permission array seeded when a tenant is
  provisioned OR when the platform re-seeds defaults
- `min_tier` — `small` / `medium` / `enterprise` gate (a role only seeds for
  tenants at or above this tier)
- `is_customisable` — can tenant admins add/remove permissions on this role, or
  is it locked to `default_permissions` (owner + admin are usually locked for
  security reasons)
- `max_custom_permissions` — cap on tenant-added perms per role

Populated by `SeedRoleDefinitionsSeeder` from `data/role-catalogue.json` on
every deploy. Ship-time changes to the catalogue require running
`rbac:sync-role-definitions` to reconcile existing tenant rows with the new
metadata.

## 8. Permission catalogue discovery

Every module that owns HTTP or CLI actions ships a `permissions.json` blueprint
(like the auth module does). At boot, `PermissionCatalogueLoader` walks every
service provider decorated with `#[ProvidesPermissions(module: 'x')]`,
aggregates the permissions, and UPSERTs them into the `permissions` table.

Discovery convention:

```php
#[ProvidesPermissions(module: 'invoices')]
final class InvoicesServiceProvider extends ServiceProvider
{
    // The permission list is read from the module's permissions.json
    // blueprint at build time and materialised into a constant.
}
```

Domain modules never manually seed permissions — the loader owns the mechanics.
Domain modules define what permissions exist by shipping the JSON.

## 9. The compact permission array — Sanctum PAT abilities

At Sanctum PAT issue-time (auth module owns the call), `PermissionResolver`
resolves the caller's full permission array + writes it as a compact string
array on the PAT's `abilities` column. Downstream services extract the array on
each request without a per-request RBAC round-trip.

Cache invalidation across the tier boundary:

1. Any RBAC mutation fires the appropriate event
2. `PermissionCacheManager` invalidates the in-process cache
3. `RbacCacheInvalidationBroadcast` broadcasts on
   `tenant.{id}.rbac.principal.{principal_id}.permissions` (Redis pubsub)
4. Every service subscribed to the channel evicts its local cache
5. On next request, the auth guard's `rbac.warm_permission_cache` middleware
   detects the stale marker on the PAT + re-resolves + updates the abilities
   column

Trade-off: permission changes take up to ~1 second to propagate across a
multi-node deployment. This is the accepted cost for the sub-millisecond
per-request permission check. Compliance flows (breach response) use
`sessions.revoke_all` for immediate lockdown.

## 10. Configuration surface

Two layers of config resolve at request time:

```
Framework defaults (config/rbac.php)
    ↓ overridden by
Tenant settings (via academorix/settings for TENANT-configurable keys —
                 e.g. auto-seed-defaults on provisioning, cache TTL)

BLOCKED BY:
Compliance floors — SOC 2 CC6.3 audit retention on rbac_changes
                    ISO 27001 A.9.2 access provisioning workflow
```

Tenant admins can adjust cache TTL (subject to the framework floor of 60s) and
toggle broadcast on/off. They can NEVER disable auditing or shorten retention.

## 11. HTTP surface — see routes.json

Twenty-eight routes total across two planes. Every tenant-plane mutation goes
through `rbac.enforce_permission:roles.manage` (owner + admin only) OR
`rbac.enforce_permission:permissions.assign` for principal-role writes. Every
platform-plane route requires the `platform_admin` guard.

Every mutation fires the appropriate event, invalidates cache, and writes an
audit-log entry with actor + before/after state.

## 12. What this module does NOT do (non-goals)

Cross-referenced with design.md §9:

- **No cross-Application role rows.** A `head_coach` role on the Sports
  Application has no meaning on the Marketplace Application. Enforced by
  `ApplicationMismatchRefused` on writes. If a role concept needs to exist in
  both, it's TWO role rows with the same name.
- **No cross-guard role rows.** A `sanctum` role never holds a `platform_admin`
  permission. Support staff on the platform plane get their own `platform_admin`
  roles.
- **No role hierarchy / inheritance.** Roles are flat by design. Composition is
  via permission attach — if `head_coach` needs to include `coach` permissions,
  attach the union set explicitly.
- **No ABAC (attribute-based access control).** RBAC + grants + delegation
  covers current needs. Symfony ExpressionLanguage in `workflow/approvals`
  provides expression-based approver selection when needed.
- **No time-of-day access restrictions.** Deferred to future work.
- **No numerical scoring / weighted permissions.** Binary (has / doesn't have).
  Weighted permissions are a future ABAC feature.
- **No role assignment approval workflow HARDCODED here.** Role assignment is a
  plain HTTP action that CAN be decorated with `#[AsApprovableAction]` at the
  domain level — but the approval workflow lives in `workflow/approvals`.
- **No policy-as-code (OPA / Cerbos / Cedar).** Deferred to future
  polyglot-microservice work.
- **No storing plaintext PAT abilities in the RBAC tables.** The compact
  permission array is cached on the Sanctum PAT's `abilities` column
  (auth-owned). RBAC owns the resolution; auth owns the caching.
- **No delegating to Identity for permission checks.** `Identity` never holds
  roles — the per-Application `User` does. This is a load-bearing invariant of
  the identity split.

## 13. Cross-references

- `.kiro/specs/access-approvals/design.md` §2 D-A1 (framework/business split),
  D-A2 (spatie extension), D-A3 (grants overlay) — the locked spec this
  blueprint materialises.
- `.kiro/specs/identity/design.md` §3 (four-principal architecture: User +
  PlatformUser + ServiceAccount on their guards).
- `.kiro/steering/hierarchy.md` §4 (two-audience boundary), §7 (module
  responsibility map).
- `.kiro/steering/tenancy-columns.md` §2 — `roles` + `permissions` carry
  `application_id` directly (two of the eight rows).
- `backend-packages/authorization/` — framework primitives
  (`#[RequirePermission]`, `#[RequireRole]`, base classes).
- `modules/identity/blueprints/auth/` — sibling Wave 1a module; RBAC sits right
  on top of it (auth caches RBAC's compact permission array on Sanctum PATs at
  issue-time).
- `modules/identity/blueprints/user/` — the per-Application `User` principal
  RBAC binds to.
- `modules/identity/blueprints/platform-user/` — the `PlatformUser` principal.
- `modules/identity/blueprints/service-accounts/` — the `ServiceAccount`
  principal.
- `modules/access/blueprints/grants/` — sibling module (Wave 1b); ships the
  concrete `GrantResolverInterface` the RBAC resolver consults.
- `modules/access/blueprints/delegation/` — sibling module (Wave 1b); ships the
  `DelegationResolverInterface`.

## 14. Migration + rollout notes

- Depends on Wave 1a's identity modules (`identity`, `user`, `platform-user`,
  `application`, `tenancy`) — priority 30 boots after all of them (they max out
  at priority 25).
- No existing rows to migrate — this is a from-scratch shipping in the
  identity-service Day-1 build.
- The `spatie/laravel-permission` migration must run first (published from the
  vendor package); our migrations then ADD columns without altering
  vendor-shipped columns.
- Every domain module in Wave 2+ SEEDS permissions on boot via
  `#[ProvidesPermissions]` — the seeder is idempotent, so re-running after a
  deploy is safe.
- The initial deployment requires Redis access — the permission cache fallback
  (DB re-resolution on every check) is functional but 40x slower and never
  intended for steady-state.
- Every downstream service consuming compact PAT abilities must upgrade to the
  version that understands the ability format (`<permission-name>` +
  `_app:<application_id>` pseudo-ability) BEFORE RBAC starts issuing PATs with
  the new shape. Coordinated deploy.
