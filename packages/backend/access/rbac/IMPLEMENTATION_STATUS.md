# access/rbac — Phase 3 implementation status

## Status: SCAFFOLDED — Actions return `null`

## Implementation plan

Roles + permissions with dual-guard (sanctum / platform_admin) + dual-scope
(application_id, tenant_id) namespacing. Wraps spatie/laravel-permission with
Academorix column-contract enforcement.

### Actions to fill

| Action                           | Contract                                               | Notes                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SyncRolePermissionsAction`      | `PUT /api/v1/roles/{role}/permissions`                 | Body: `{ permissions: string[] }`. REFUSE cross-guard writes with `GuardMismatchException` (422). REFUSE cross-application writes with `ApplicationMismatchException` (422). Atomic in `DB::transaction`. |
| `AssignRoleAction`               | `POST /api/v1/users/{user}/roles`                      | Body: `{ role_id: string }`. Refuses cross-tenant assignment. Enforces `PrincipalTooManyRolesException` (blueprint says ≤ N).                                                                             |
| `UnassignRoleAction`             | `DELETE /api/v1/users/{user}/roles/{role}`             | Idempotent (204 on already-unassigned).                                                                                                                                                                   |
| `AttachPermissionToRoleAction`   | `POST /api/v1/roles/{role}/permissions/{permission}`   | Single-permission attach (contrast SyncRolePermissions which replaces the whole set).                                                                                                                     |
| `DetachPermissionFromRoleAction` | `DELETE /api/v1/roles/{role}/permissions/{permission}` | Single-permission detach.                                                                                                                                                                                 |
| `CreateRoleAction`               | `POST /api/v1/roles`                                   | Body: `{ name, guard_name, permissions: string[] }`. Refuses reserved/system role names. Enforces `CustomRoleQuotaExceededException` for non-enterprise tiers.                                            |
| `UpdateRoleAction`               | `PATCH /api/v1/roles/{role}`                           | Rename + description. `SystemRoleMutationRefusedException` on system roles.                                                                                                                               |
| `DeleteRoleAction`               | `DELETE /api/v1/roles/{role}`                          | Refuses when the role is still attached to N principals (blueprint: cascade-detach path is opt-in).                                                                                                       |
| `ListRolesAction`                | `GET /api/v1/roles`                                    | Tenant scope + application scope.                                                                                                                                                                         |
| `ShowRoleAction`                 | `GET /api/v1/roles/{role}`                             | Includes attached permissions.                                                                                                                                                                            |
| `ListPermissionsAction`          | `GET /api/v1/permissions`                              | Every registered permission (enum-emitted + system + custom).                                                                                                                                             |

### Services to implement

- `SyncRolePermissions` — the write-path guard. Every mutation goes through it.
  Refuses cross-guard + cross-app writes.
- `PermissionCatalogueLoader` — walks every `#[AsPermissionEnum]` in the
  codebase at boot and upserts `permissions` rows. Idempotent.
- `PermissionCacheManager` — spatie's built-in cache, exposed as an interface so
  tests can flush it.
- `PermissionResolver` — for a given (user, action, resource) tuple, resolve the
  effective permission set considering role membership + scope inheritance.
- `GuardBoundaryEnforcer` — the compliance guard called from every write action.
  `$user->guard_name === $role->guard_name` OR raise.
- `ScopeSuffixValidator` — verify `.branch` / `.own` suffixes on permission
  strings are wired to a valid scope level.
- `RoleAssignmentService` — orchestrator for the assign / unassign flow with
  audit logging.
- `TenantDefaultRoleSeeder` — seed the initial role catalog per tenant at
  provisioning.

### Cross-guard / cross-app enforcement (P0)

The write-path guard is the single most important thing this module owns. The
blueprint invariant:

- A `sanctum`-guard role can only carry `sanctum`-guard permissions.
- A `platform_admin`-guard role can only carry `platform_admin`-guard
  permissions.
- A role bound to `application_id = X` can only carry permissions bound to
  `application_id = X` (or nullable app_id = platform-scope).

Both checks fire on `SyncRolePermissions` — writing a `sanctum` role's
permissions to include a `platform_admin` permission returns 422
`GuardMismatchException`. Writing a Sports role's permissions to include a
Marketplace permission returns 422 `ApplicationMismatchException`.

### Events to fire

- `RoleCreated`, `RoleUpdated`, `RoleDeleted`.
- `RolePermissionsSynced`.
- `UserRoleAssigned`, `UserRoleUnassigned`.

### Cross-module dependencies

- `authorization` — `#[RequirePermission]` / `#[RequireRole]` attribute reader.
- `identity/user` — role assignment target.
- `identity/platform-user` — platform-plane role assignment target.
- `spatie/laravel-permission` — vendored library backing the schema.
