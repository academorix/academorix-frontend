# `modules/access/` — access-service blueprints

The **authorization vocabulary** — roles, permissions, policies, scopes, groups,
invitations. Answers _"may this caller do this thing, in this context?"_ Zero
business logic — domain modules ask this service (or its JWT claims) whether an
actor may act; they never embed their own RBAC.

Deploys to `academorix-backend/apps/access-service/` (see
[`apps/access-service/README.md`](../../../academorix/academorix-backend/apps/access-service/README.md)).

## Modules — on disk

| Module                                    | Wave | Priority | Schemas | Purpose                                                                                                                                |
| ----------------------------------------- | ---- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| [`invitations/`](./invitations/readme.md) | 3    | 25       | 2       | Target-agnostic invitation substrate — send → accept/decline funnel for any invited entity (tenant member, team member, org admin, …). |

**Total on disk: 1 module, 2 schemas.**

## Modules — planned

Three more modules will land here to complete the access-service surface:

| Module    | Priority target | Purpose                                                                                                                                                                                                                                                                                |
| --------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `access/` | 20 (Wave 2)     | Roles + Permissions + Policies. Built on `spatie/laravel-permission` with `teams = true`, guard-namespaced (`sanctum` vs `platform_admin`) AND application-namespaced. Ships `#[RequirePermission]` + `SyncRolePermissions` with `GuardMismatch` / `ApplicationMismatch` (422) guards. |
| `scope/`  | 22 (Wave 3)     | Cascading resolution tree (`global → application → tenant → org → region → branch → team → user`), `#[ScopedTo]`, `ResolveScope` middleware, and per-namespace consumer registration.                                                                                                  |
| `groups/` | 22 (Wave 3)     | Named principal groups for bulk grants — instead of assigning a role to 50 users, assign it to a group.                                                                                                                                                                                |

`invitations` was authored first as substrate — every future consumer of the
invitation flow (tenant membership, team enrollment, org admin, service account
access) uses the same target-agnostic funnel.

## Why access is separate from platform

Two reasons:

1. **Change cadence** — authorization models change independently of tenancy
   models. Splitting RBAC into its own service means an access-model refactor
   doesn't force a platform-service redeploy.
2. **JWT-first authorization** — the access-service produces the permission
   claims that identity-service embeds in JWTs. Every other service verifies
   locally and never calls back to authorization. That means access-service is
   on a slow path (permission grants change infrequently); putting it alongside
   platform-service (fast path) would blur the difference.

## Cross-cutting invariants

- **No cross-guard rows** — a `sanctum` role never holds a `platform_admin`
  permission. `SyncRolePermissions` refuses these writes with `GuardMismatch`
  (422).
- **No cross-application rows** — a Sports role has no meaning in Marketplace.
  `ApplicationMismatch` (422) at write time.
- **Role/permission rows carry `application_id` directly** — one of the eight
  rows in [`tenancy-columns.md`](../../.kiro/steering/tenancy-columns.md) §2.
- **`scope_node_id` is config-consumer only** — never on domain data rows. Only
  settings, feature-flags, entitlements, subscription, and notifications are
  legitimate scope consumers.

## For agents

The invitations module already exists — read its `readme.md` before authoring
anything that composes it. The three planned modules land in this order:

1. `access/` — everything else depends on the Role + Permission vocabulary.
2. `scope/` — needed by settings/entitlements before their full config surface
   can compose.
3. `groups/` — pure sugar over `access/`. Last.

When authoring `access/`, remember: **the access-service does NOT own login**.
That's identity-service's job. Access answers _"what may this actor do?"_;
Identity answers _"is this actor authenticated?"_ The `access-service` consumes
JWTs signed by identity-service and reads `sub` + `app` + `tenant_id` claims
from them.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` §4 — module→service map.
- `.kiro/steering/hierarchy.md` §4 — two-audience boundary (guard split).
- `.kiro/steering/hierarchy.md` §15 — access control mapping onto the tree.
- `.kiro/steering/scope.md` — scope framework contract.
