# rbac — changelog

## [Unreleased] — Wave 1b inception

**Blueprint-only. No code yet.**

Initial blueprint authoring for the `rbac` module — the runtime role +
permission storage layer for the sanctum + platform_admin guards. Codifies the
D-A1 / D-A2 / D-A3 decisions locked in `.kiro/specs/access-approvals/design.md`
and pins the enforceable surface for the code phase that follows.

### Structural

- Six blueprint tables — three spatie-shipped tables augmented with Academorix
  scope columns (`roles`, `permissions`, `role_has_permissions`) and three
  additional Academorix-owned tables (`model_has_roles` +
  `model_has_permissions` extend spatie's pivots; `role_definitions` is entirely
  new).
- Prefixed ULIDs across the module: `rol_` (Role), `per_` (Permission), `rdf_`
  (RoleDefinition). Pivot rows use spatie's default id types (composite unique
  on the FK columns).
- The (application_id, tenant_id, name, guard_name) composite unique on `roles`
  and `permissions` is enforced by BOTH the DB constraint AND the observer
  (defense in depth against the write-race).
- Framework/business split honoured (design.md §2 D-A1): every
  `#[RequirePermission]` / `#[RequireRole]` primitive lives in
  `backend-packages/authorization/` and is IMPORTED here — never redeclared.

### Contributions

- **20 events** — every role + permission lifecycle transition (create / update
  / delete on roles + permissions + pivots), assignment lifecycle (assigned +
  revoked + expired), boundary enforcement refusals
  (SystemRoleModificationRefused, GuardMismatchRefused,
  ApplicationMismatchRefused), cache invalidation, custom-role tier analytics.
  All payloads readonly value objects; every dispatch after-commit.
- **5 jobs** — TenantDefaultRoleSeeder (on TenantProvisioned),
  ReconcileRoleDefinitionsJob (nightly), PurgeExpiredRoleAssignmentsJob
  (hourly), InvalidatePermissionCacheJob (bulk, on-demand),
  PurgeSoftDeletedRolesJob (daily).
- **4 notifications** — role assigned, role revoked, assignment expiring soon,
  custom-role limit reached. Categories seeded with the appropriate consent
  tier.
- **11 Artisan commands** — list-roles, describe-role, seed-defaults,
  sync-role-definitions, list-principal-roles, assign-role, revoke-role,
  list-permissions, audit-permission-check (the diagnostic for 'why can Alice
  see this?'), purge-expired-assignments, migrate-legacy-roles.
- **7 validation rules** — valid_role_name, valid_permission_name,
  permission_belongs_to_role_guard, permission_belongs_to_role_application,
  role_assignable_by_actor (the privilege-escalation guard), role_not_system,
  principal_belongs_to_current_application.
- **3 casts** — GuardName (enum), PermissionName (dot-notated string with
  validated scope suffix), ResolvedPermissionSet (compact array).
- **3 middleware** — rbac.enforce_permission (the primary gate),
  rbac.enforce_role (coarser role-based gate), rbac.warm_permission_cache
  (auto-applied to api group).
- **2 macros** — Blueprint::guardable_columns, Blueprint::rbac_scoped_columns.
- **4 traits** — HasRoles, HasPermissions, HasResolvedPermissions,
  IsPermissionable.
- **2 attributes** — `#[AsRbacListener]`, `#[ProvidesPermissions]`.
- **4 policies** — RolePolicy, PermissionPolicy, RoleAssignmentPolicy,
  RoleDefinitionPolicy.
- **6 observers** — RoleObserver (enforces GuardMismatch + is_system
  immutability), PermissionObserver, RoleHasPermissionsObserver,
  ModelHasRolesObserver, ModelHasPermissionsObserver, RoleDefinitionObserver.
- **13 listeners** — cache-invalidation chains on every mutation + cross-module
  bridges (TenantProvisioned → seed defaults; UserSuspended → invalidate cache;
  IdentityErased → cascade revoke; grants + delegation mutation events →
  invalidate the affected principal's cache; EntitlementDowngraded → reconcile
  custom roles).
- **10 health probes** — schema current, catalogue loaded, cache reachable,
  broadcast reachable, role definitions seeded, system roles immutable
  (dry-transaction probe), purge scheduler alive, resolver latency budget,
  orphaned pivots, custom role quota not exceeded.
- **28 routes** across two planes — tenant plane (16 routes) covers role +
  permission CRUD, principal role assignment, self-serve reads; platform plane
  (12 routes) covers system-role CRUD, role_definitions metadata, permissions
  CRUD, tenant-reseed support endpoint.

### Data model

- **7 seeded default role sets** in `data/role-catalogue.json` — academy,
  sports-center, school, gym, federation, club, plus the platform-admin role
  set. Each entry maps to a role_definitions row with business_type_slugs +
  min_tier + default_permissions + i18n labels.
- **~50 seed permissions** in `data/permission-catalogue.json` — the base RBAC +
  roles + permissions + principals + platform surface. Domain modules ship their
  own permissions.json blueprints that the PermissionCatalogueLoader aggregates
  at boot.
- Sample resolver decision traces in `data/resolver-decision-samples.json`
  covering each of the 5 algorithm steps for QA reference.

### Compliance surface

- **SOC 2 CC6.1** — logical access controls: PermissionResolver is THE entry
  point; deny-priority ensures explicit blocks always win.
- **SOC 2 CC6.3** — user access provisioning: every role assignment audited
  (actor + timestamp + reason). System role modification refused
  - logged critical.
- **SOC 2 CC6.6** — prevent unauthorized access: GuardMismatch +
  ApplicationMismatch refusals at write time (422).
- **ISO 27001 A.9.2.1–A.9.2.6** — user registration, provisioning, privileged
  access, review, adjustment.
- **GDPR Art. 5(1)(f)** — least privilege via scope suffixes.
- **GDPR Art. 25** — data protection by design: default deny at step 5 of the
  resolver.
- **GDPR Art. 32** — cross-node cache invalidation window bounded to <1 second.

### Boundaries

- RBAC NEVER redeclares framework attributes. `#[RequirePermission]` /
  `#[RequireRole]` live in `backend-packages/authorization/` per design.md §2
  D-A1.
- RBAC NEVER owns grants. Per-resource dynamic grants (deny + allow) live in
  `access/grants` (Wave 1b sibling). This module consumes
  `GrantResolverInterface` through the DenyGrantStrategy + AllowGrantStrategy
  resolver strategies.
- RBAC NEVER owns delegation. Time-bounded role delegation + impersonation
  sessions live in `access/delegation` (Wave 1b sibling). This module consumes
  `DelegationResolverInterface` through the DelegationStrategy.
- RBAC NEVER owns credential storage. Users, PlatformUsers, ServiceAccounts, and
  Identities are owned by the identity-service modules. This module attaches
  ROLES to them polymorphically.
- RBAC NEVER stores plaintext PAT abilities. Auth caches the compact permission
  array on Sanctum PAT abilities at issue-time; this module produces the array
  via PermissionResolver.
- RBAC tables carry BOTH `application_id` AND `tenant_id` (design.md §2 D-A2).
  These are two of the eight rows enumerated in
  `.kiro/steering/tenancy-columns.md` §2.

### HTTP surface

- **28 routes** total across two planes:
  - Tenant plane (`/api/v1/rbac/*` + `/api/v1/me/*`): 16 routes for tenant
    role + permission management + assignment + self-serve reads.
  - Platform plane (`/api/v1/platform/rbac/*`): 12 routes for system role CRUD,
    role_definitions metadata, cross-Application permissions CRUD, tenant-reseed
    support endpoint.

### Known blueprint deviations from the design spec

The blueprint stays faithful to design.md §2 (D-A1, D-A2, D-A3), §3 (data
model), §8 (cross-module dependencies), §9 (non-goals). Two pragmatic additions
that go slightly beyond the spec:

1. **`role_definitions` as a distinct table.** design.md §3 introduces
   role_definitions as a metadata sidecar to roles. This blueprint promotes it
   to a first-class polymorphic-friendly table with its own observers + policy +
   platform-admin CRUD surface. Materialises the spec's "metadata layer"
   language explicitly.
2. **The `PermissionCatalogueLoader` + `#[ProvidesPermissions]` discovery
   pattern.** design.md §8 says "domain modules depend on `access/rbac` for
   permission checks" but doesn't specify the catalogue-loading mechanism. This
   blueprint materialises the pattern: modules ship `permissions.json`; a
   boot-time loader scans providers and UPSERTs into the `permissions` table.
   Consistent with how the auth module's permission seeder works — extended to a
   discovery model so domain modules never touch seeders directly.

Every addition preserves every design invariant (framework/business split,
spatie-extended tables, resolver composition, deny-priority) and simply
materialises the flows described in prose.

### Compatibility

- Depends on `foundation`, `compliance`, `identity`, `user`, `platform-user`,
  `application`, `tenancy`, `entitlements`.
- Priority 30 — boots right after auth (25) so the compact permission array is
  available the moment Sanctum PATs start issuing.
- Extended by `access/grants` (32), `access/delegation` (33), `access/requests`
  (34), `workflow/approvals` (35), and every downstream domain module
  (indirectly via the resolver + middleware).
- No existing rows to migrate — this is a from-scratch shipping in the
  identity-service Day-1 build.
- The `spatie/laravel-permission` migration must run first (published from the
  vendor package). Our migrations then ADD columns without altering
  vendor-shipped columns.
- Every downstream service consuming compact PAT abilities must upgrade to the
  version that understands the ability format (`<permission-name>` +
  `_app:<application_id>` pseudo-ability) BEFORE RBAC starts issuing PATs with
  the new shape. Coordinated deploy.
