# ADR 0008 — Keep `authorization` + `access` as two packages

**Status:** Accepted **Date:** 2026-07-21 **Deciders:** Backend architecture

## Context

The permission substrate has two audiences that need it for different reasons:

1. **Every domain package needs to DECLARE against permissions.** Every Action
   carries `#[RequirePermission(Foo::Bar)]`. Every controller pipeline installs
   the middleware. Every service references a permission enum case. The
   declaration surface is universal.

2. **Only some deployables need to ADMINISTER permissions.** The tenant API
   renders `/api/admin/roles`; the AI service does not. A slim worker that
   verifies inbound JWTs and checks abilities has no admin surface at all. The
   administration surface is app-specific.

A single-package design forces every consumer to inherit the second audience's
weight — Eloquent models, migrations, spatie/laravel- permission wiring,
`Gate::before` super-admin bypass, admin CRUD controllers, per-tenant permission
caches. The AI service pulling in 90% of that vendor surface just to check
`$user->can(...)` is disproportionate.

The pattern that resolves this — used by Laravel core itself
(`illuminate/contracts` vs `illuminate/support`), NestJS (`@nestjs/common` vs
`@nestjs/core`), and Symfony Security (`security-core` vs `security-bundle`) —
is the **contract-implementer split**: one lightweight package holds the
declarations + contracts + middleware; a separate heavy package holds the
storage + admin + vendor wiring.

## Options considered

1. **One `access` package covering both concerns (reject).** Every consumer
   (including the AI service) pulls in Eloquent + spatie + admin controllers.
   Vendor size ratio is bad; slim deployables inherit a surface they never use.

2. **Split into `access-core` + `access-store` (reject naming).** The `-core` /
   `-store` suffix reads as an artificial split. What we want to communicate is
   that the light package IS the concern (authorization) and the heavy package
   IS the implementation (role/permission storage).

3. **Two packages named for their concerns — `authorization` (light) + `access`
   (heavy) (chosen).** `authorization` ships attributes + contracts +
   middleware. `access` ships models + migrations + admin CRUD + spatie wiring.
   The AI service pulls only `authorization`. The tenant API pulls both.

## Decision

### D1 — `authorization` is the light package

Composer name: `stackra/authorization`. Ships:

- **`Attributes/`** — `#[RequirePermission]`, `#[RequireRole]`, `#[AllowGuest]`.
  Every consumer attaches them to Actions + controllers.
- **`Contracts/`** — `PermissionEnum`, `PermissionContributor`,
  `RoleContributor`, `UserContract`. The contracts the reference implementation
  satisfies.
- **`Middleware/`** — `AuthorizeControllerAction`. Type-hints against
  `UserContract` (never `Illuminate\Foundation\Auth\User` or an Eloquent model).
- **Provider** — registers middleware alias + contributor tag; no DB
  bootstrapping, no boot-time queries.
- **ZERO Eloquent models. ZERO migrations. ZERO admin controllers. ZERO vendor
  deps beyond framework + PHP.**

Every consumer depends on `authorization`. It must stay cheap.

### D2 — `access` is the heavy package

Composer name: `stackra/access`. Ships:

- **`Models/`** — `Role`, `Permission` (Eloquent, spatie-composed).
- **`database/migrations/`** — `roles`, `permissions`, `role_has_permissions`,
  `model_has_roles`, `model_has_permissions` tables (spatie's schema +
  `application_id` extension per ADR-0027).
- **`Actions/Admin/`** — `ListRoles`, `CreateRole`, `AssignPermission`, etc.
  HTTP surface for the admin console.
- **`Providers/`** — spatie/laravel-permission wiring; `Gate::before`
  super-admin bypass; per-tenant permission cache.
- **`require`s** `stackra/authorization`. Never the reverse.

Apps that need the admin surface pull `access` in. Apps that only need to
DECLARE against the concern don't.

### D3 — Contracts live in the light package

`PermissionContributor` + `RoleContributor` interfaces live in
`stackra/authorization`, not `stackra/access`. This is the seam that lets a
consumer type against the contract without importing the storage. If contracts
lived in the heavy package, every consumer that types against them would inherit
the heavy package — defeating the split.

### D4 — Contract registrations happen at boot in the light package

The light package's provider registers the CONTRIBUTOR TAG at boot. The heavy
package's provider registers IMPLEMENTERS against that tag — never the tag
itself. This keeps the discovery contract owned by the concern layer, not the
implementation layer.

### D5 — Vendor coupling stays in the heavy package

`spatie/laravel-permission` is a required dep of `stackra/access`. It is NOT a
dep of `stackra/authorization`. If we swap `spatie/laravel-permission` for a
different vendor lib (or a first-party implementation), only the heavy package
moves; every consumer of `stackra/authorization` keeps working against the same
attribute + contract surface.

## Consequences

**Positive:**

- **Slim consumers stay slim.** The AI service pulls `authorization` and gets
  attribute-based ability checks without hauling spatie/laravel-permission +
  admin CRUD.
- **Vendor swap is a bounded operation.** Only the heavy package changes when
  the underlying store swaps.
- **Test isolation.** Tests of authorization behaviour don't need DB migrations;
  the light package's test suite uses in-memory fakes.
- **Clean deprecation path.** A future `access-v2` package can ship alongside
  `access` and delegate through the same `authorization` contracts.

**Negative:**

- **Two packages instead of one.** Two `composer.json`s, two READMEs, two
  changelog rows on every release. The ceremony pays off because every domain
  package requires the light package but only ~2 apps require the heavy one.
- **Contract stability discipline.** Once a contract in the light package ships,
  changing it is a breaking change across every domain package. Mitigated by
  treating contract changes as ADR- worthy events.

**Neutral:**

- **The pattern is a template.** Every future concern with the same two-audience
  shape follows this split (see the candidate list in
  `.kiro/steering/contract-implementer-split.md`).

## Related work

- `.kiro/steering/contract-implementer-split.md` — the day-to-day authoring
  rules this ADR codifies (three-question decision test, canonical shape,
  anti-patterns, candidate future splits).
- `.kiro/steering/package-architecture.md` §10 "When to split a package into
  contract + implementer" — the split reference from the canonical package
  layout.
- `.kiro/steering/discovery.md` — the boot-time discovery seam that lets heavy
  packages register implementers against light-package contracts.
- `packages/backend/authorization/` — the concrete light package.
- `packages/backend/access/` — the concrete heavy package.
