# Frontend Domain Rebuild — Design

## Overview

We rebuild the `apps/web` domain layer to mirror the backend blueprint, on top
of the foundations already shipped:

- **Module framework** — `src/lib/module/` (contract + glob registry + shared
  routes); each feature module contributes resources + routes via a manifest.
- **Refine data layer** — REST + JSON-mock providers switched by
  `VITE_API_MOCK`; spatie query builder alignment in
  `lib/query/laravel-query.ts`.
- **Refine UI kit** — `src/components/refine/` (views, buttons, breadcrumbs,
  `ResourceDataGrid`).
- **Theme** — HeroUI `useTheme` switcher.
- **Authenticated shell** — `src/components/layout/authenticated-layout.tsx`.

Three new capabilities are added:

1. A **scope context layer** (Tenant → Organization → Branch → Team → Season)
   with providers, context, hooks, and switchers.
2. An **attributes / SDUI** foundation for sport-variable fields.
3. A reorganized, blueprint-accurate **type + fixture** layer, replacing the
   demo set.

The design keeps the golden rule intact: **frontend owns screens (code), backend
owns the capability manifest (data from `/auth/me`)**.

---

## 1. The hierarchy & scope model

The backend hierarchy is `Tenant → Region → Organization → Branch → Team`, with
`Season` as a cross-cutting boundary. On the frontend:

- **Tenant** is fixed per host/subdomain and delivered in `/auth/me` — not a
  user-chosen scope in normal operation (cross-tenant switch is Requirement 9).
- **Organization, Branch, Season** form the **active working scope** the user
  selects. `Region` is a commercial dimension of a branch (currency/tax/locale),
  surfaced read-only, not a primary scope selector in v1.
- **Team** is a filter within a branch/season, not a global switcher (chosen
  contextually on team-scoped screens).

### 1.1 ScopeProvider & context

New directory `src/lib/scope/` (framework-agnostic infra, like `lib/module`):

```
src/lib/scope/
├── scope.types.ts        # ActiveScope, AllowedScopes, ScopeContextValue
├── scope-context.tsx     # React context + ScopeProvider (persistence + validation)
├── use-scope.ts          # useScope() — active scope + setters + derived objects
├── use-tenant.ts         # useTenant() — tenant summary from identity
├── scope-storage.ts      # localStorage read/write (tenant-namespaced keys)
└── index.ts              # barrel
```

Shape:

```ts
interface ActiveScope {
  organizationId: string | null;
  branchId: string | null;
  seasonId: string | null;
}

interface AllowedScopes {
  organizations: Organization[];
  branches: Branch[]; // filtered to the active organization
  seasons: Season[];
}

interface ScopeContextValue {
  scope: ActiveScope;
  setOrganization(id: string | null): void;
  setBranch(id: string | null): void;
  setSeason(id: string | null): void;
  organization?: Organization;
  branch?: Branch;
  season?: Season;
  allowed: AllowedScopes;
  isReady: boolean;
}
```

Behavior:

- The provider seeds `allowed` from `/auth/me` (identity carries the caller's
  accessible organizations/branches/seasons) and from list fetches where needed.
- Active scope is persisted per tenant in `localStorage`
  (`academorix.scope.<tenant_slug>`), validated on load against `allowed`, and
  defaulted (default org → default branch → active season).
- Changing organization re-derives the allowed branches and, if the current
  branch is not under the new org, resets it.
- `ScopeProvider` is mounted **inside** the authenticated area (it needs the
  identity), between `<Authenticated>` and the shell.

### 1.2 Switchers

Under `src/components/scope/`:

```
src/components/scope/
├── tenant-switcher.tsx        # cross-tenant (or static indicator)
├── organization-switcher.tsx  # HeroUI Select bound to useScope().setOrganization
├── branch-switcher.tsx        # branches filtered by active org
├── season-switcher.tsx        # seasons; shows status chip (active/upcoming/closed)
└── index.ts
```

Each switcher: a HeroUI `Select` (secondary variant) populated from
`useScope().allowed`, gated by permission (e.g. hide branch switcher without
`branches.viewAny`), and rendered read-only/hidden when only one option exists.
They sit in the navbar (`authenticated-layout`) beside the theme + user menu.

### 1.3 Scope-aware data provider

The active scope must reach `getList`. Approach: a thin **scope binding** that
wraps Refine's data hooks' `meta`/`filters` at the layout boundary is intrusive;
instead we integrate at the provider via a **scope accessor**:

- `providers/data/scope-filter.ts` exposes a module-level `getActiveScope()` /
  `setActiveScope()` (updated by `ScopeProvider` on change).
- Both providers, in `getList`, read `getActiveScope()` and, for the resource's
  declared `scopedBy` dimensions (from the manifest resource `meta.scopedBy`),
  append `filter[branch_id]=…` etc. — composing with, never overriding, caller
  filters.
- The mock provider applies the same equality filters to fixtures.

Resource manifests declare scope sensitivity in `meta`:

```ts
meta: { label: "Athletes", scopedBy: ["organization", "branch", "season"], … }
```

`AppResourceMeta` gains an optional `scopedBy?: ScopeDimension[]`.

---

## 2. Module map (backend → frontend)

Every module below becomes a `src/modules/<domain>/` (or sports sub-domain) with
a manifest. Resource names are the blueprint's canonical names. "Screens" notes
the initial delivery for the module's wave (L=list, C=create, E=edit, S=show, or
a custom surface). Fixtures listed are the `public/data/*.json` files to author.

### Platform & cross-cutting

| Module (dir)     | Resource                 | Wave   | Screens                      | Key fixtures                     |
| ---------------- | ------------------------ | ------ | ---------------------------- | -------------------------------- |
| `tenancy`        | `tenants`                | 0      | context + switcher (no CRUD) | via `me.json`                    |
| `organization`   | `organizations`          | 0      | L/S + switcher               | `organizations.json`             |
| `branches`       | `branches`               | 0      | L/C/E/S + switcher           | `branches.json`                  |
| `regions`        | `regions`                | 0      | L/S                          | `regions.json`                   |
| `users`          | `users`                  | 1      | L/C/E/S                      | `users.json`                     |
| `access`         | `roles`                  | 1      | L/S (roles + scoped grants)  | `roles.json`, `permissions.json` |
| `staff`          | `staff`                  | 1      | L/C/E/S                      | `staff.json`                     |
| `reception`      | `reception`              | 1      | queue + visits surface       | `approval-tasks.json`            |
| `attributes`     | `attributes`             | 0      | admin L/S (+ SDUI engine)    | `attribute-sets.json`            |
| `documents`      | `documents`              | 0      | L/S                          | `documents.json`                 |
| `notifications`  | `notification-templates` | 0      | L/E                          | `notification-templates.json`    |
| `billing`        | `subscription`           | 1      | S (plan + quotas)            | `subscription.json`              |
| `people`         | `people`                 | 1      | placeholder                  | —                                |
| `expenses`       | `expenses`               | 2      | L/C/E/S                      | `expenses.json`                  |
| `credentials`    | `credentials`            | 2      | L/S                          | `credentials.json`               |
| `ai`             | `ai`                     | 3      | placeholder (flag)           | —                                |
| `admin`          | `admin`                  | 1      | console shell                | —                                |
| `reports`        | `reports`                | 3      | dashboards                   | `reports/*.json`                 |
| `data-lifecycle` | `data-lifecycle`         | 0/late | placeholder                  | —                                |
| `integrations`   | `integrations`           | 4      | L/S                          | `integrations.json`              |

### Sports domain (`src/modules/sports/<sub-domain>/`)

| Sub-domain      | Resource            | Wave | Screens               | Attr?         | Fixtures                                                           |
| --------------- | ------------------- | ---- | --------------------- | ------------- | ------------------------------------------------------------------ |
| `registry`      | `sports`            | 0    | L/S (tenant overlay)  | provides sets | `sports.json`, `tenant-sports.json`                                |
| `seasons`       | `seasons`           | 1    | L/C/E/S               | —             | `seasons.json`                                                     |
| `athletes`      | `athletes`          | 1    | L/C/E/S               | **yes**       | `athletes.json`, `athlete-enrollments.json`, `attribute-sets.json` |
| `teams`         | `teams`             | 1    | L/C/E/S               | —             | `teams.json`, `team-members.json`                                  |
| `registrations` | `registrations`     | 1    | L/S                   | —             | `registrations.json`                                               |
| `events`        | `events`            | 1    | L/C/E/S + RSVP        | —             | `events.json`, `event-invitations.json`                            |
| `facilities`    | `facilities`        | 1    | L/S (flag)            | —             | `facilities.json`                                                  |
| `coaching`      | `coaches`           | 2    | L/S (view over staff) | —             | `coach-assignments.json`                                           |
| `training`      | `training-sessions` | 2    | L/C/E/S               | —             | `training-sessions.json`                                           |
| `matches`       | `matches`           | 2    | L/C/E/S               | —             | `matches.json`                                                     |
| `sessions`      | `private-sessions`  | 2    | L/C/E/S               | —             | `private-sessions.json`                                            |
| `attendance`    | `attendance`        | 2    | capture surface       | —             | `attendance.json`                                                  |
| `progress`      | `progress`          | 2    | cards (SDUI)          | **yes**       | `progress.json`                                                    |
| `formations`    | `formations`        | 3    | builder               | —             | `formations.json`                                                  |
| `performance`   | `performance`       | 3    | tests (SDUI)          | **yes**       | `performance-tests.json`                                           |
| `medical`       | `medical`           | 3    | L/S (restricted)      | —             | `medical.json`                                                     |
| `development`   | `development`       | 3    | L/S                   | —             | `development.json`                                                 |
| `drills`        | `drills`            | 3    | library               | —             | `drills.json`                                                      |
| `competition`   | `competitions`      | 3    | standings             | —             | `competitions.json`, `standings.json`                              |
| `safeguarding`  | `safeguarding`      | 3    | L/S                   | —             | `safeguarding.json`                                                |
| `awards`        | `awards`            | 4    | L/S                   | —             | `awards.json`                                                      |

### Communication & commerce

| Module          | Resource        | Wave | Screens                | Fixtures                         |
| --------------- | --------------- | ---- | ---------------------- | -------------------------------- |
| `payments`      | `payments`      | 1    | invoices L/S + refunds | `invoices.json`, `payments.json` |
| `memberships`   | `memberships`   | 1    | L/C/E/S                | `memberships.json`               |
| `announcements` | `announcements` | 2    | L/C/E/S                | `announcements.json`             |
| `messaging`     | `conversations` | 2    | thread surface         | `conversations.json`             |
| `leads`         | `leads`         | 3    | pipeline               | `leads.json`                     |
| `passes`        | `passes`        | 4    | L/S                    | `passes.json`                    |
| `public-site`   | `public-site`   | 4    | CMS surface            | `pages.json`                     |

> Modules beyond the current wave are registered as **placeholder** manifests
> (nav entry + `ComingSoonPage`) so the sidebar reflects the full product, gated
> by feature/permission, without dead CRUD routes. A route is only declared once
> its page exists.

---

## 3. Types reorganization (`src/types/`)

Replace the flat `models.ts` with a folder split by bounded context, re-exported
from `types/index.ts`:

```
src/types/
├── enums.ts               # all string-literal unions + *_LABELS (expanded)
├── platform.ts            # Tenant, Region, Organization, Branch, TenantSummary, Identity, AllowedScopes
├── access.ts              # Role, Permission, ScopedGrant
├── people.ts              # User, UserProfile, Staff, Guardian, Athlete, AthleteEnrollment
├── structure.ts           # Season, Team, TeamMember, Registration
├── scheduling.ts          # Event, Invitation, TrainingSession, Match, PrivateSession, Attendance
├── development.ts         # Progress, PerformanceTest, Medical, Award, Drill
├── commerce.ts            # Invoice, Payment, Membership, Expense, Subscription
├── attributes.ts          # Attribute, AttributeSet, AttributeGroup, AttributeValue
├── api.ts                 # envelope types (ApiResource, ApiCollection, meta, message)
└── index.ts               # barrel
```

Rules: snake_case fields matching the blueprint "Key records"; ISO-8601 string
timestamps; UUID string ids; scope columns present per the blueprint; every
field documented, esp. where meaning isn't obvious. `Athlete` keeps typed
identity columns; sport-variable data lives on `AthleteEnrollment.attributes`
(SDUI).

---

## 4. Attributes / SDUI foundation

New `src/lib/attributes/` (definitions + renderer):

```
src/lib/attributes/
├── attribute.types.ts     # Attribute, AttributeSet, AttributeGroup, widget/type unions
├── use-attribute-set.ts   # loads a set by (entityType, discriminator) via useCustom/fixture
├── attribute-field.tsx    # renders ONE attribute by widget (integer/select/boolean/slider)
├── attribute-form.tsx     # renders a full set (groups + fields) into a values object
├── attribute-view.tsx     # read-only rendering for show pages / cards
└── index.ts
```

- A host form (e.g. athlete enrollment) renders typed inputs for base columns +
  `<AttributeForm set={set} value={record.attributes} onChange=…/>` for the
  sport-variable block.
- Values live in a single `attributes: Record<string, unknown>` on the host
  record (mirrors backend `JSONB`). Filterable/projected attributes (e.g.
  `primary_position`) may also appear as typed columns for list/sort.
- Attribute set fixtures (`public/data/attribute-sets.json`) keyed by
  `entity_type` + `sport_key`, versioned, with bilingual labels.
- Widgets map to HeroUI: integer/number → `Input type=number`/slider; select →
  `Select`; boolean → `Switch`; text → `Input`. Validation from set metadata.

This is the **only** place we do server-driven UI, exactly as the blueprint
mandates (bespoke screens everywhere else).

---

## 5. `/auth/me` bootstrap contract (mock)

`me.json` expands to seed identity + scope:

```jsonc
{
  "data": {
    "id": "…", "email": "…", "profile": { … },
    "roles": ["owner"], "permissions": ["*"],
    "features": ["athletes","teams","seasons","events","attendance","payments","staff","reception", …],
    "terminology": { "athletes": "Students" },
    "tenant": { "id","slug","name","business_type","branding" },
    "tenants": [ … ],                    // for cross-tenant switch (usually 1)
    "scopes": {                          // drives the switchers
      "organizations": [ { id, name, is_default } ],
      "branches": [ { id, organization_id, name, region_id, is_default } ],
      "seasons": [ { id, name, status, is_current } ]
    }
  }
}
```

The `Identity` type gains `tenants`, `scopes`. `map-identity.ts` maps these.

---

## 6. Layout integration

`authenticated-layout.tsx` navbar gains (order): `TenantSwitcher` (if multi) ·
`OrganizationSwitcher` · `BranchSwitcher` · `SeasonSwitcher` · spacer ·
`ThemeSwitcher` · `UserMenu`. On small screens the scope switchers collapse into
a single "Scope" popover. The sidebar is unchanged (registry-driven,
permission + feature filtered, terminology labels) but now also filters by the
resource's feature key which is present for the full module set.

`ScopeProvider` wraps the shell inside `<Authenticated>` in `App.tsx` so scope
is available to every protected route and the switchers.

---

## 7. Removal / migration plan

1. Delete `modules/courses/` and `public/data/courses.json` (no blueprint peer).
2. Move `modules/athletes|coaches|teams|branches` into their blueprint homes:
   - `athletes` → `modules/sports/athletes/`
   - `teams` → `modules/sports/teams/`
   - `coaches` → `modules/sports/coaching/` (resource `coaches`, view over
     staff)
   - `branches` → `modules/branches/` (platform; stays, enriched schema) Use
     `git mv` to preserve history; update manifests + imports (glob registry
     requires no central edit).
3. Split `types/models.ts` into the `types/` folder (§3); update imports.
4. Rebuild fixtures for the new/renamed resources; delete legacy ones.
5. Update `frontend-module-architecture.md` steering: scope layer, sports
   sub-domain layout, attributes/SDUI, expanded module map.

Each step keeps gates green; commits are per logical step.

---

## 8. Phasing (mirrors blueprint waves)

- **Wave 0 — Foundations.** Scope layer (`lib/scope`, switchers, provider
  wiring, scope-aware providers), attributes/SDUI (`lib/attributes`), types
  reorganization, expanded `me.json`, platform modules `tenancy`/`organization`/
  `branches`/`regions`, `attributes` admin (basic), `documents`/`notifications`
  placeholders, sport `registry`. Remove legacy `courses`; relocate sports dirs.
- **Wave 1 — Structure/acquisition/money/people.** `seasons`, `athletes` (+SDUI
  enrollment), `teams`, `registrations`, `events`/RSVP, `payments`,
  `memberships`, `staff`, `reception`, `users`, `access`, `admin` shell,
  `people` placeholder, `billing` subscription view, `facilities` (flag).
- **Wave 2 — Activities/participation/cost/check-in.** `coaching`, `training`,
  `matches`, `sessions`, `attendance`, `progress` (+SDUI), `expenses`,
  `credentials`, `announcements`, `messaging`.
- **Wave 3 — Development/competition/content/compliance/AI.** `performance`,
  `medical`, `development`, `drills`, `competition`, `formations`,
  `safeguarding`, `reports`, `leads`, `ai`.
- **Wave 4 — Reach & polish.** `integrations`, offline sync, `passes`, `awards`,
  `public-site`.

---

## 9. Quality & conventions

- All existing gates stay green each wave: `pnpm build`, `pnpm lint` (web 0
  warnings), `pnpm knip`, `pnpm format`, `pnpm test`, `pnpm size` (CSS budget
  already raised for Pro).
- Placeholder modules keep `knip` green because their manifest +
  `ComingSoonPage` are reachable via the glob registry.
- Docblocks/comments mandatory on every file, type, symbol, provider, hook.
- No new deps without approval (SDUI + scope are built on existing HeroUI +
  Refine + React).
- Commits: conventional, body lines ≤100 chars, staged paths (never `-A`), never
  commit `.kiro/settings/mcp.json`.

---

## 10. Risks & decisions

- **Scope propagation approach.** A module-level scope accessor read by the data
  providers avoids threading `meta` through every hook and keeps mock/REST
  identical. Trade-off: it's a controlled global; it is written only by
  `ScopeProvider` and read only by the providers, documented as such.
- **Attribute values typing.** `attributes` is `Record<string, unknown>`;
  per-set typing is validated at the renderer, not the TS type — acceptable
  since sets are dynamic/tenant-defined.
- **Volume.** ~30 modules is large; placeholders + waves keep each increment
  shippable. Full CRUD is built only where a wave calls for it; other modules
  start as list/show or placeholder and deepen in later passes.
- **Team as scope vs filter.** Team is intentionally a contextual filter, not a
  global switcher, to avoid a 4-deep switcher bar; revisit if UX demands it.
