# Frontend Domain Rebuild — Requirements

## Introduction

The current `apps/web` frontend was scaffolded with a small, ad-hoc set of demo
resources (`athletes`, `coaches`, `courses`, `teams`, `branches`) and matching
JSON fixtures. That shape does **not** reflect the real product defined in the
backend **Domain Modules Blueprint** (`backend/DOMAIN_MODULES_BLUEPRINT.md`) and
the **Identity & Tenancy Spec** (`backend/IDENTITY_AND_TENANCY_SPEC.md`).

This spec rebuilds the frontend domain layer to mirror the backend
**module-for-module**, on the enterprise foundations we already have (Refine
data layer, HeroUI Pro, the `components/refine` kit, the `lib/module` framework,
the theme system). It also introduces the missing **scope context layer** —
Tenant → Organization → Branch → Team → Season — with providers, context, hooks,
and **switcher** components, so the whole app is aware of "where" the user is
working.

The work is delivered as a **clean rebuild**: legacy demo modules, fixtures, and
model types that don't match the blueprint are removed, and every module is
recreated from the blueprint schema with full docblocks and detailed comments.

### Goals

1. Mirror the backend module catalogue (Blueprint Part IV) as frontend modules,
   using the canonical resource names and the real record schema.
2. Add a first-class **scope context** (tenant/org/branch/team/season) that
   drives navigation, data-provider filtering, and switcher UIs.
3. Keep authorization, features, and terminology **100% data-driven** from
   `GET /auth/me` (no hardcoded roles/permissions/labels).
4. Support **sport-agnostic, attribute-driven (SDUI)** forms/cards where the
   backend says fields vary per sport (athlete enrollment, progress,
   performance).
5. Rebuild JSON fixtures for every resource so the entire app runs against mocks
   (`VITE_API_MOCK=true`) before the API exists, with byte-compatible shapes.
6. Preserve all quality gates (build, lint, knip, format, test, size) green and
   docblocks/comments on every file, type, and exported symbol.

### Non-goals

- No backend changes (this is the frontend repo). The mock fixtures encode the
  agreed response contract; the REST provider consumes the same shapes.
- No new runtime dependencies without explicit approval.
- Not every module ships pixel-complete in one pass — modules are delivered in
  the blueprint's **build waves**; each wave is fully done (schema + list + CRUD
  where applicable + fixtures + gates) before the next.

---

## Requirements

### Requirement 1 — Domain alignment with the blueprint

**User story:** As a product owner, I want the frontend modules and their data
shapes to match the backend blueprint exactly, so the two codebases stay 1:1 and
switching from mock to REST is a no-op.

#### Acceptance criteria

1. WHEN the module registry is enumerated THEN every module SHALL correspond to
   a backend module/sub-domain in Blueprint Part IV using its canonical resource
   name (e.g. `athletes`, `teams`, `seasons`, `events`, `attendance`,
   `payments`, `staff`, `reception`, `competitions`).
2. WHERE a resource exists in both the frontend and the blueprint THE model type
   in `@/types` SHALL contain exactly the fields listed in that module's "Key
   records" (snake_case, ISO-8601 timestamps, matching enums).
3. WHEN a legacy resource that has no blueprint equivalent is found (e.g.
   `courses`) THEN it SHALL be removed (module, fixture, type, references).
4. IF a record is tenant-scoped in the blueprint THEN its type SHALL include
   `tenant_id` and any deeper scope columns the blueprint specifies
   (`organization_id`, `region_id`, `branch_id`, `team_id`, `season_id`).
5. THE model types SHALL model the five-level hierarchy — `Tenant`, `Region`,
   `Organization`, `Branch`, `Team` — and the `Season` boundary as first-class
   entities.

### Requirement 2 — Scope context (tenant / org / branch / team / season)

**User story:** As an academy operator working across divisions and venues, I
want to select which organization, branch, and season I'm working in, so lists,
forms, and dashboards are scoped to that context.

#### Acceptance criteria

1. THE app SHALL provide a **ScopeProvider** that holds the active
   `{ organizationId, branchId, seasonId }` (tenant is fixed by the
   host/subdomain and comes from `/auth/me`).
2. THE app SHALL expose a **`useScope()`** hook returning the active scope plus
   setters, and derived helpers (current org/branch/season objects).
3. THE active scope SHALL persist across reloads (localStorage), be validated
   against the identity's allowed scopes, and fall back to sensible defaults
   (default organization, default branch, active season).
4. THE authenticated shell SHALL render **switcher** components — an
   **OrganizationSwitcher**, a **BranchSwitcher**, and a **SeasonSwitcher** — in
   the layout, each populated from the scope data source and gated by
   permission.
5. WHEN the active scope changes THEN scope-aware list queries SHALL refetch
   with the new `organization_id` / `branch_id` / `season_id` filters applied.
6. WHERE a user has access to only one organization (or branch/season) THE
   corresponding switcher SHALL render read-only or be hidden, never blocking.
7. THE tenant identity (name, slug, business_type, branding) SHALL be readable
   via a **useTenant()** hook sourced from `/auth/me`, and a tenant indicator
   SHALL be shown in the shell (with switch-tenant affordance only for users who
   span tenants — see Requirement 9).

### Requirement 3 — Scope-aware data provider

**User story:** As a developer, I want the active scope automatically applied to
list requests, so I don't hand-thread `branch_id` into every hook.

#### Acceptance criteria

1. THE data provider (mock and REST) SHALL accept scope filters and apply them
   to `getList` as `filter[organization_id]`, `filter[branch_id]`,
   `filter[season_id]` per the spatie query contract.
2. WHERE a resource declares in its manifest which scope dimensions it honors
   (e.g. `scopedBy: ["branch", "season"]`) THE provider integration SHALL apply
   only those filters for that resource.
3. THE mock data provider SHALL filter fixtures by the same scope columns so
   mock behavior matches REST.
4. THE scope filters SHALL compose with user-supplied Refine filters/sorters
   without overriding them.

### Requirement 4 — Data-driven authorization, features, terminology

**User story:** As a multi-tenant platform, I want each tenant to see only its
enabled modules with its own labels and the caller's permissions, with nothing
hardcoded.

#### Acceptance criteria

1. THE sidebar and route guards SHALL derive visibility from the identity's
   `features[]` (feature toggle) and `permissions[]` (RBAC), exactly as today.
2. Resource labels SHALL use tenant `terminology{}` overrides with a code
   default fallback.
3. THE frontend SHALL NOT contain a hardcoded role→permission map; the
   action→ability convention (`list→viewAny`, etc.) is the only allowed
   constant.
4. THE `/auth/me` mock (`me.json`) SHALL return `roles[]`, `permissions[]`,
   `features[]`, `terminology{}`, `tenant`, and the caller's **allowed scopes**
   (organizations/branches/seasons) needed by the switchers.

### Requirement 5 — Sport-agnostic attribute (SDUI) forms

**User story:** As an academy running multiple sports, I want athlete
enrollment/progress/performance fields to vary per sport, driven by the backend
attribute sets, not hardcoded columns.

#### Acceptance criteria

1. WHERE the blueprint marks a host entity as attribute-driven (athlete
   enrollment, progress cards, performance tests) THE frontend SHALL render
   those dynamic fields from an **attribute set** definition (SDUI), not fixed
   inputs.
2. THE attribute renderer SHALL support the documented widgets/types (integer,
   select, boolean, slider, …), validation (min/max/required), bilingual labels,
   and grouping/ordering.
3. THE dynamic attribute **values** SHALL be stored/read on a single
   `attributes` object on the host record (mirrors the backend `JSONB` column).
4. THE attribute set definitions SHALL be provided as fixtures (`public/data/`)
   keyed by discriminator (`sport_key`) so SDUI works under mocks.
5. THE base/typed fields (name, DOB, team, season) SHALL remain normal typed
   form inputs; only the sport-variable fields are SDUI.

### Requirement 6 — Per-module structure & conventions

**User story:** As a developer, I want every module to follow the same structure
and the shared kit, so the codebase is predictable and reviewable.

#### Acceptance criteria

1. Each module SHALL live in `src/modules/<domain>/` with a `*.module.tsx`
   manifest (resources + routes), and screens under `pages/` (per-action files:
   `list`/`create`/`edit`/`show`), following the existing steering.
2. The sports domain SHALL mirror the backend's single-module/sub-domain layout
   under `src/modules/sports/<sub-domain>/` (registry, athletes, teams, seasons,
   events, training, matches, sessions, attendance, progress, …).
3. Screens SHALL compose the `@/components/refine` kit (views, buttons,
   `ResourceDataGrid`, breadcrumbs) and Refine headless hooks — no bespoke table
   or action-bar plumbing per page.
4. Create/edit SHALL share one controlled form per resource in the module's
   `components/`.
5. Every file, exported symbol, type field, provider, and hook SHALL carry a
   docblock; non-obvious logic SHALL carry inline comments.

### Requirement 7 — Fixtures rebuild

**User story:** As a developer, I want realistic mock data for every resource so
the whole app is demoable without a backend.

#### Acceptance criteria

1. FOR every resource with a list/detail screen THERE SHALL be a
   `public/data/<resource>.json` fixture (pure record array, snake_case,
   matching the model type and scope columns).
2. Fixtures SHALL be internally consistent (foreign keys resolve — a `branch_id`
   on an athlete matches a branch in `branches.json`; scope columns align with
   `me.json` allowed scopes).
3. Fixtures SHALL NOT embed pagination `meta`; the mock provider synthesizes it.
4. Legacy fixtures with no blueprint equivalent SHALL be deleted.

### Requirement 8 — Clean rebuild & removal of legacy

**User story:** As a maintainer, I want the old demo modules gone so there's no
dead or misleading code.

#### Acceptance criteria

1. Legacy modules/fixtures/types not in the blueprint (notably `courses`) SHALL
   be deleted, and all references removed (registry auto-updates via glob).
2. Renames SHALL preserve history via `git mv` where practical.
3. After removal THE app SHALL build, typecheck, and pass all gates with no
   dangling imports.
4. The steering (`frontend-module-architecture.md`) SHALL be updated to document
   the scope layer, the sports sub-domain layout, and the attribute/SDUI
   approach.

### Requirement 9 — Tenant switching (cross-tenant users)

**User story:** As a coach/guardian who works across academies, I want to switch
tenants, so I can operate in the right academy without re-logging in.

#### Acceptance criteria

1. WHERE the identity indicates membership in more than one tenant THE shell
   SHALL render a **TenantSwitcher**; otherwise it SHALL show a static tenant
   indicator.
2. Switching tenants SHALL re-bootstrap identity (`/auth/me`) and reset the
   scope (org/branch/season) to that tenant's defaults.
3. Cross-tenant identity linking (the Stackra ID / People module) is **out of
   scope for the UI in early waves** and SHALL be represented only as a
   placeholder module until its wave.

### Requirement 10 — Phased delivery (build waves)

**User story:** As a delivery lead, I want the rebuild sequenced by dependency
so each increment is shippable and green.

#### Acceptance criteria

1. Implementation SHALL follow the blueprint's build waves (0→4); a wave is
   "done" only when its modules have schema + fixtures + the screens defined for
   the wave + all gates green.
2. Wave 0 SHALL establish the scope context layer, the attributes/SDUI
   foundation, the reorganized types, and the base fixtures before feature
   modules are built.
3. Each wave SHALL be independently committable and SHALL not break earlier
   waves.
