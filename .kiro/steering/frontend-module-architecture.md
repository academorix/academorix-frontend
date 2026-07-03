---
inclusion: always
---

# Academorix — Frontend Module Architecture Standard

The canonical architecture, layering, and conventions for the Academorix web
frontend (pnpm + Turborepo, Vite 8 + React 19, Refine headless on TanStack
Query, HeroUI + HeroUI Pro, React Router v7). This is the source of truth for
frontend work and mirrors the backend `php-module-architecture.md` so the two
codebases stay conceptually 1:1.

## Precedence

1. This file wins over generic guidance wherever they differ. Two deliberate
   rules:
   - **Docblocks and detailed comments are mandatory** on every file, exported
     symbol, provider, hook, and non-obvious block.
   - **Every change keeps all quality gates green** (`pnpm quality` +
     `pnpm test` + `pnpm size`).
2. `AGENTS.md` still applies (pnpm only; versions via the catalog; HeroUI via
   `@academorix/ui`; `onPress` not `onClick`; `Separator` not `Divider`).
3. **Consistency first:** match existing module patterns; this standard is the
   target every module migrates toward.

---

## 1. The golden rule — hybrid, not server-driven UI

**The frontend owns the screens (code). The backend owns the capability manifest
(data).** We do **not** fetch a UI schema and render generic tables.

- Bespoke UX (DataGrid columns, forms, custom cells, detail layouts) lives in
  **frontend module code** — that is the whole reason we use HeroUI Pro.
- The backend decides, per tenant / `business_type`, **which** resources are
  enabled, their **terminology labels**, and the caller's **permissions** —
  delivered in the bootstrap payload (`GET /api/v1/auth/me`). This maps directly
  to the backend's `business_type.default_config` (feature toggles + terminology
  - default roles).
- The app registers **all** modules statically, then **filters / labels /
  orders** them at runtime from the manifest. Adding a resource = add a frontend
  module + enable it on the backend. No UI-schema engine, full type safety, real
  multi-tenancy.

```
Frontend modules (code: screens, columns, forms)        ← this repo
        +
Backend manifest (data: enabled features, labels, perms) ← /auth/me
        ↓  merged at runtime
Refine resources + nav + route guards (filtered & labeled)
```

---

## 2. Directory layout

Mirror the backend's `modules/<Name>/` with `src/modules/<domain>/`. Domain code
never lives in `lib/` (that is framework-agnostic infrastructure).

```
apps/web/src/
├── modules/<domain>/        # one folder per bounded context (mirrors backend)
│   ├── pages/               # route screens (lazy-loaded)
│   ├── components/          # module-only components (optional; e.g. forms)
│   ├── layouts/ providers/ hooks/   # module-only, optional
│   └── <domain>.module.tsx  # THE manifest: resources + routes (default export)
├── modules/sports/<sub>/    # the sports domain nests one level (athletes, teams,
│                            #   seasons, events, coaching, registry, …)
├── providers/               # APP-LEVEL Refine providers (data/auth/live/notification/access)
├── lib/                     # infra only: framework-agnostic
│   ├── module/              # the module framework: module.ts + registry.ts + routes.ts (+ barrel)
│   ├── refine/              # cross-cutting Refine hooks/helpers (e.g. useResourceLabel)
│   ├── scope/               # tenant/org/branch/season scope: provider, hooks, filters
│   ├── attributes/          # SDUI engine: use-attribute-set + field/form/view renderers
│   ├── i18n/                # i18n: LocaleProvider + Refine i18nProvider (en/ar catalogs, RTL)
│   ├── query/ http/ api/    # spatie query builder, HTTP client, OpenAPI types
│   └── format.ts            # shared date/money formatters
├── components/              # shared, reusable UI widgets
│   ├── layout/              # app-level shell(s), e.g. authenticated-layout
│   ├── scope/               # tenant/org/branch/season switchers
│   ├── theme/               # theme switcher (HeroUI useTheme: light/dark/system)
│   ├── access/              # RBAC page guard: ResourceAccessGuard (useCan) + AccessDenied
│   ├── i18n/                # LanguageSwitcher (en/ar) mounted in the navbar
│   ├── refine/              # Refine UI kit: buttons/ + views/ + breadcrumbs + resource-data-grid
│   └── entity-status-chip.tsx   # shared status chip
├── config/                  # env, site (NOT routes — those live in lib/module or per module)
└── types/                   # domain types split by context (+ enums, api envelopes)
```

- Create only the folders a module needs; do not scaffold empty layers.
- Module names are lowercase and match the backend (`organization`, `athletes`,
  `auth`, `billing`, …). The **sports** domain mirrors the backend's single
  module with one level of sub-domain nesting (`modules/sports/<sub>/`); the
  glob registry matches both `modules/*/*.module.tsx` and
  `modules/*/*/*.module.tsx`.

### Layouts, providers & hooks — where they live

- **App-level shell layout** (the authenticated `AppLayout`+`Sidebar`+`Navbar`
  frame) lives in `src/components/layout/`. It wraps _every_ authenticated
  module, so it is app infrastructure — never place it in a feature module.
- **Core providers** (data / auth / live / notification / access-control) are
  the _app's_ strategy, shared by all modules → `src/providers/`. They are not
  owned by any feature (e.g. the auth **provider** is app-level; the `auth`
  **module** only owns the login screen/route).
- **Module-owned layouts/providers** are supported by **composition**: a module
  wraps its route `element` in its own layout (`modules/<name>/layouts/`) and/or
  context provider (`modules/<name>/providers/`). No contract change needed.
- **The module framework itself** (contract + registry + shared routes) lives in
  `src/lib/module/`. **Cross-cutting Refine hooks/helpers** → `src/lib/refine/`.
  **Module-only** hooks → `modules/<name>/hooks/`.
- **Environment**: validate with **zod** in `config/env.ts` (this is a Vite SPA
  — all vars are client `VITE_*`; Vite enforces the prefix). Do **not** add
  `@t3-oss/env-core` — its server/client split only pays off with SSR/Node.

### The scope layer — tenant / organization / branch / season

The app is **scope-aware**: users work within a Tenant → Organization → Branch →
Season context. This lives in `src/lib/scope/` (framework-agnostic) + the
switchers in `src/components/scope/`.

- **`ScopeProvider`** (mounted inside `<Authenticated>` in `App.tsx`) reads the
  caller's accessible scopes from `identity.scopes` (`/auth/me`), resolves the
  active org/branch/season (persisted per-tenant in `localStorage`, validated,
  defaulted), and cascades (changing org re-validates the branch).
- **`useScope()`** exposes the active scope, setters, resolved option objects,
  and the allowed lists (branches already filtered to the active org).
  **`useTenant()`** exposes the tenant + cross-tenant switch.
- **Switchers** (`OrganizationSwitcher`/`BranchSwitcher`/`SeasonSwitcher`/
  `TenantSwitcher`) are data-driven: hidden with 0 options, read-only indicator
  with 1, a `Select` with many — **never blocking**. Mounted in the shell navbar
  - sidebar header.
- **Scope reaches lists** without per-hook plumbing: a resource opts in via
  `meta.scopedBy: ["organization" | "branch" | "season"]`, and
  `ResourceDataGrid` appends `buildScopeFilters(scope, scopedBy)` as
  **permanent** `useTable` filters. Because they're part of the query key,
  changing scope refetches automatically; the providers need no change (they
  already emit `filter[branch_id]=…`). Compose, never override, user filters.

### Attributes / SDUI — the sport-agnostic core

The **only** place we do server-driven UI. Where the blueprint marks a host as
attribute-driven (athlete enrollment, progress, performance), sport-variable
fields are rendered from an **attribute set** selected by `sport_key`, not
hardcoded columns.

- `src/lib/attributes/`: `useAttributeSet({ entityType, discriminatorValue })`
  loads the set (highest version) via the `attribute-sets` resource;
  `AttributeForm`/`AttributeField`/`AttributeView` render/validate it; value
  helpers (`defaultAttributeValues`, `validateAttributeValues`, …) are pure.
- Values live in a single `attributes: Record<string, unknown>` on the host
  record (mirrors the backend `JSONB`); typed base columns stay on the model.
- Widgets map to HeroUI (`select`→Select, `switch`→Switch, `slider`→Slider,
  `number`/`date`/`input`→TextField). Labels are bilingual (en/ar), RTL-ready.
- Base/typed fields (name, DOB, team, season) remain normal typed inputs; only
  the sport-variable block is SDUI.

---

## 3. The module manifest (`<domain>.module.tsx`)

Each module default-exports one `AppModule`. It declares its **Refine
resource(s)** and its **routes**. Nothing else in the app hard-codes routes or
resources.

```ts
// src/lib/module/module.ts
import type { IconType } from "@academorix/ui/icons";
import type { ResourceProps } from "@refinedev/core";
import type { ReactElement } from "react";

/** Which auth tier a route belongs to. */
export type RouteTier = "public" | "protected";

/** A single route contributed by a module. */
export interface AppModuleRoute {
  tier: RouteTier;
  /** Omit + set `index: true` for the index route. */
  path?: string;
  index?: boolean;
  /** Lazy element, e.g. `createElement(lazy(() => import("./pages/list")))`. */
  element: ReactElement;
}

/** Extra, Academorix-specific resource metadata (on `ResourceProps.meta`). */
export interface AppResourceMeta {
  label: string;
  /** Icon *component* (heroicons-compatible `IconType`), not a rendered element. */
  icon?: IconType;
  /** Tenant feature-toggle key; hidden unless the manifest enables it. */
  featureKey?: string;
  /** Permission required to see/enter, e.g. "athletes.viewAny". */
  requiredPermission?: string;
  /** Optional nav group / parent resource name. */
  parent?: string;
  /** Sidebar sort order (ascending; default 0). */
  order?: number;
}

/** A Refine resource whose `meta` is strongly typed as `AppResourceMeta`. */
export type AppResource = Omit<ResourceProps, "meta"> & {
  meta: AppResourceMeta;
};

/** A feature module: its Refine resources + its routes. */
export interface AppModule {
  name: string;
  resources?: AppResource[];
  routes?: AppModuleRoute[];
}
```

```tsx
// src/modules/sports/athletes/athletes.module.tsx
import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/lib/module";

const AthleteListPage = lazy(
  () => import("@/modules/sports/athletes/pages/list"),
);

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      meta: {
        label: "Athletes", // default; overridden by tenant terminology
        icon: AcademicCapIcon, // an icon COMPONENT (IconType), not an element
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
        scopedBy: ["branch"], // list filtered by the active branch
      },
    },
  ],
  routes: [
    {
      tier: "protected",
      path: "/athletes",
      element: createElement(AthleteListPage),
    },
  ],
};

export default athletesModule;
```

---

### Resource pages — Refine CRUD convention

A resource module's screens follow Refine's per-action file layout, one file per
CRUD action:

```
src/modules/sports/athletes/
├── pages/
│   ├── list.tsx      # default export → AthleteList
│   ├── create.tsx    # default export → AthleteCreate
│   ├── edit.tsx      # default export → AthleteEdit
│   └── show.tsx      # default export → AthleteShow
├── components/       # module-only pieces (e.g. athlete-form, form-skeleton)
└── athletes.module.tsx
```

- Each page file **default-exports** its component and is **lazy-imported** per
  file (we code-split per route). This differs from the Refine starter's named
  exports + `index.ts` barrel + eager imports — intentionally, for splitting.
- The manifest declares the resource's `list`/`create`/`edit`/`show` **paths**
  and a route per page. **Only declare a route once its page exists** (no dead
  nav links). Screens use Refine headless hooks (`useTable`, `useForm`,
  `useShow`).
- Pages are thin: they compose the shared **Refine UI kit** (below) plus a
  module-local form (create/edit share one controlled form in
  `modules/<name>/components/`). A module with multiple resources nests:
  `pages/<resource>/{list,…}.tsx`.

### The Refine UI kit — `components/refine/`

We do **not** copy the Refine starter's shadcn `refine-ui` kit; we ship the
HeroUI + HeroUI Pro equivalents in `src/components/refine/` (import from the
`@/components/refine` barrel). Same coverage, our design system:

```
src/components/refine/
├── buttons/                 # ListButton, CreateButton, EditButton, ShowButton,
│                            #   CloneButton, DeleteButton, RefreshButton
├── views/                   # ListView, CreateView, EditView, ShowView (+ ViewHeader)
├── breadcrumbs.tsx          # useBreadcrumb → HeroUI Breadcrumbs (react-router links)
└── resource-data-grid.tsx   # useTable ⇄ HeroUI Pro DataGrid + Pagination bridge
```

- **Action buttons** wrap Refine's `use*Button` hooks, so navigation, labels,
  loading, and **access-control gating** (hidden/disabled via the
  `accessControlProvider`) are consistent everywhere. A hidden button renders
  `null` — never a disabled dead control the user can't use. Pass `isIconOnly`
  (with `aria-label`) for compact row actions.
- **View scaffolds** render breadcrumbs + a tenant-aware title + the action
  buttons appropriate to the action, then the page content. `ListView` adds
  `CreateButton`; `Show`/`Edit`/`Create` add a back button + relevant actions.
  Buttons inside a routed view default to the route's resource + `:id`.
- **`ResourceDataGrid`** is the standard table: pass `columns` + `resource`; it
  owns `useTable`, the single-column sort bridge (DataGrid `SortDescriptor` ⇄
  Refine `sorters`, server-side), the empty/loading state, and pagination.
  Feature modules provide columns, never table plumbing.
- **`DeleteButton`** confirms in a popover and honours undoable mutation mode
  (the "Undo" toast comes from the notification provider).

### Theme switching — `components/theme/`

Dark mode uses **HeroUI's native `useTheme`** (`@academorix/ui/react`), not
`next-themes`: HeroUI v3 ships `useTheme` for Vite/CRA apps — it persists to
`localStorage`, resolves `"system"`, and writes both `class` + `data-theme` to
`<html>`. The `ThemeSwitcher` lives in the navbar; the body carries
`bg-background text-foreground`. Do not add `next-themes` (extra dep + double
theme controllers).

### Where the module system lives — `lib/module/`, not `app/`

The module **contract + wiring** (`lib/module/module.ts`,
`lib/module/registry.ts`, `lib/module/routes.ts`, plus a barrel
`lib/module/index.ts`) lives in `src/lib/module/` — it is framework-agnostic
infrastructure, so it belongs under `lib/`, not in an `app/` folder.
`src/lib/refine/` holds only **reusable, structure-agnostic** Refine
hooks/helpers. Import everything module-related from the `@/lib/module` barrel.
There is no `src/app/` directory.

### Icons — `IconType` from the UI package

Resource icons are **components**, typed as `IconType` from
`@academorix/ui/icons` (heroicons-compatible). Manifests pass the component
(`icon: AcademicCapIcon`); the layout renders it with consistent sizing. Never
pass a pre-rendered element.

## 4. The registry (glob aggregation)

The registry discovers every `*.module.tsx` with Vite's `import.meta.glob`
(eager — manifests are tiny; the page components inside stay lazy). `App.tsx`
and `providers.tsx` consume the registry; neither imports modules directly.

```ts
// src/lib/module/registry.ts
import type {
  AppModule,
  AppModuleRoute,
  AppResource,
} from "@/lib/module/module";

// NOTE: import.meta.glob does NOT resolve the `@` alias — the pattern is
// relative to this file (two levels deep under src/lib/module/).
const manifests = import.meta.glob<{ default: AppModule }>(
  "../../modules/*/*.module.tsx",
  {
    eager: true,
  },
);

export const appModules: AppModule[] = Object.values(manifests).map(
  (m) => m.default,
);

export const appResources: AppResource[] = appModules.flatMap(
  (m) => m.resources ?? [],
);

export const publicRoutes: AppModuleRoute[] = appModules.flatMap(
  (m) => m.routes?.filter((r) => r.tier === "public") ?? [],
);

export const protectedRoutes: AppModuleRoute[] = appModules.flatMap(
  (m) => m.routes?.filter((r) => r.tier === "protected") ?? [],
);
```

---

## 5. RBAC & the bootstrap manifest — no hardcoded authorization

Authorization is **100% data-driven** from `/auth/me`. The frontend never
hard-codes role→permission maps.

`GET /api/v1/auth/me` returns the bootstrap manifest:

```jsonc
{
  "data": {
    "id": "…",
    "email": "…",
    "profile": {
      "first_name": "…",
      "display_name": "…",
      "avatar_url": null,
      "locale": "en",
      "timezone": "…",
    },
    "roles": ["owner"], // plain string[] — never a fixed frontend union
    "permissions": ["*"], // effective capability list; "*" = superuser
    "features": ["athletes", "coaches", "courses", "teams", "branches"], // enabled per business_type
    "terminology": { "athletes": "Students" }, // label overrides per business_type
    "tenant": {
      "id": "…",
      "slug": "…",
      "name": "…",
      "business_type": "academy",
    },
  },
}
```

Rules:

- `roles` and `permissions` are `string[]` sourced from `me`. The
  `accessControlProvider` checks `permissions` (with `"*"` = allow-all); gate UI
  with Refine `<CanAccess>` and filter the sidebar by `requiredPermission`.
- **Terminology** overrides a resource's default `meta.label` per tenant (a
  gym's "Athletes" may render "Members"; an academy's "Students").
- **Features** filter which registered resources appear (feature toggles /
  entitlements). A module present in code but absent from `features` is hidden.
- The only frontend-side convention is the thin Refine-action → policy-ability
  map (`list→viewAny`, `show→view`, `create→create`, `edit→update`,
  `delete→delete`, `clone→create`); everything the user _can do_ comes from
  `me`.

### Enforcement & demo personas

- **Provider:** `src/providers/access-control/` maps each Refine action to a
  policy ability and answers `can` from the cached identity's `permissions`
  (`"*"` = superuser); it enables access control on the kit buttons.
- **Page guards:** `src/components/access/` ships `ResourceAccessGuard` (built
  on Refine's `useCan`) + an `AccessDenied` panel. The
  `List`/`Show`/`Create`/`Edit` view scaffolds wrap their body in it, so a user
  who reaches a route they lack permission for sees `AccessDenied` instead of
  the content — closing the direct-URL gap (the sidebar already hides the
  entry). Use `<CanAccess>` / `useCan` directly for finer-grained inline gating.
- **Demo personas (mock mode):** `public/data/demo-users.json` seeds seven users
  — owner + admin (superuser `"*"`), plus head_coach, coach, reception, finance,
  and medical_officer, each with a curated `permissions` + `features` set so
  RBAC differences are visible end-to-end (nav, buttons, guards). The login
  screen offers one-click sign-in per persona; the mock auth provider resolves
  the persona by email and persists the choice across reloads.

---

## 6. Data layer & response contract

Providers live in `src/providers/` and are selected by `VITE_API_MOCK` (mock
JSON fixtures vs the Laravel REST API). Domain models mirror the backend
verbatim (**snake_case**, ISO-8601 timestamps) so mock and REST are
interchangeable.

Canonical response contract (both the mock and the future backend modules follow
it; the backend uses `spatie/laravel-data`, so enable `wrap => 'data'` for
resource endpoints):

| Kind                     | Shape                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| List                     | `{ data: T[], meta: { current_page, per_page, total, last_page, from, to }, links: {…} }` |
| Single / create / update | `{ data: T, message?: string }`                                                           |
| Delete                   | `204 No Content` (or `{ message }`)                                                       |
| Error                    | HTTP 4xx/5xx + `{ message, errors?: { field: string[] } }`                                |

- **`meta`** — yes, on lists; it drives pagination (`meta.total`).
- **`message`** — yes, on **mutations only** (for toasts); noise on reads.
- **No body-level `success`/`status`** — the HTTP status code is the single
  source of truth (redundant flags drift).
- **Fixtures are pure record arrays.** The mock data provider synthesizes the
  `meta`/`message` envelope + pagination at runtime, so it behaves exactly like
  the paginated backend. Do not bake `meta` into fixture files.
- Query contract follows
  [spatie/laravel-query-builder v7](https://spatie.be/docs/laravel-query-builder/v7/introduction):
  `page` + `per_page` (Laravel paginator), `sort=-created_at,name`,
  `include=branch,team`, and **named filters**. Filters split into two buckets:
  bare `filter[field]=value` for `eq`/`contains`/`in` (comma-joined; the backend
  `AllowedFilter` decides exact vs partial), and `filter[field][<op>]=value` for
  comparison/range/presence operators (`gte`, `lte`, `between`, `null`, …) which
  a single custom spatie operator filter interprets. See
  `lib/query/laravel-query.ts`.

---

## 7. Screens & styling

- Import UI from `@academorix/ui/react`; icons from
  `@academorix/ui/icons/{outline,solid,mini,micro}`. Never `@heroui/*` directly.
- **Compose the Refine UI kit** (`@/components/refine`):
  `ListView`/`CreateView`/ `EditView`/`ShowView` for scaffolding, the action
  buttons, and `ResourceDataGrid` for tables. Do not hand-roll table plumbing or
  action bars per page.
- **Resource tables use `ResourceDataGrid`** (HeroUI Pro `DataGrid` under the
  hood): config-driven columns + controlled sort bridged to Refine `sorters`,
  with a `Pagination` footer wired to `useTable`.
- The app shell is HeroUI Pro `AppLayout` + `Sidebar` + `Navbar`; the sidebar is
  generated from Refine `useMenu()` (resources), filtered by permission/feature.
- List/detail/form screens use Refine headless hooks (`useTable`, `useForm`,
  `useShow`, `useList`, `useCustom`) — the data source is transparent (mock vs
  REST).
- Routes are **code-split**: page components are `lazy`; a single `Suspense`
  boundary renders a spinner.

---

## 8. Business-type & tenant handling

- A resource has a **canonical name** (`athletes`) that never changes; its
  **display label** is tenant-driven (`terminology` from the manifest),
  defaulting to `meta.label`.
- Feature availability is tenant-driven (`features` from the manifest). Code the
  module once; the backend decides who sees it.
- Tenant branding (logo, colors) come from the manifest/tenant and are applied
  in the shell + theme.
- **i18n is implemented** in `src/lib/i18n/`: a `LocaleProvider` (mounted above
  `<Refine>` in `providers.tsx`) holds the active locale, builds a Refine
  `i18nProvider` over the en/ar message catalogs, persists the choice, and
  toggles the document `dir` (RTL for Arabic). The navbar `LanguageSwitcher`
  changes it; keys missing from a catalog fall back to the English default. This
  is the app-chrome vocabulary — distinct from per-tenant **terminology** (§5),
  which relabels resources (e.g. "Athletes" → "Students").

---

## 9. Docblocks & comments (mandatory)

Every file carries meaningful documentation.

- **File/module docblock:** what it is and its role.
- **Exported symbols:** one-line summary; `@param`/`@returns` on non-trivial
  functions; document the _why_ for non-obvious logic (auth gate, tenancy
  boundary, bundle/lazy decision).
- **Types:** document each field where the meaning isn't obvious; note
  snake_case = API contract.
- Prefer TSDoc blocks over inline noise; keep both accurate as code changes.

---

## 10. Quality gates & workflow

Before finalizing any change:

1. `pnpm build` (includes typecheck) — green.
2. `pnpm lint` — 0 errors (warnings tolerated only for the ported UI package).
3. `pnpm knip` — green.
4. `pnpm format:check` — clean (`pnpm format` to fix; printWidth 100).
5. `pnpm test` — green; add tests for new providers/hooks/pages.
6. `pnpm size` — within budget (route-split so the shell stays lazy).
7. Conventional-commit per feature; stage specific files (never `git add -A`);
   never commit `.kiro/settings/mcp.json`.

---

## 11. New-module checklist

- [ ] `src/modules/<domain>/` created (mirrors backend module name).
- [ ] `pages/` screens (lazy), composed from the `@/components/refine` kit
      (`ListView`/`ShowView`/… + `ResourceDataGrid`) + Refine headless hooks.
- [ ] `<domain>.module.tsx` default-exports an `AppModule` (resources + routes);
      declare `create`/`edit`/`show` paths only once their pages exist.
- [ ] Resource `meta` sets `label`, `icon`, `featureKey`, `requiredPermission`.
- [ ] Create/edit share one controlled form in `modules/<domain>/components/`.
- [ ] Domain shapes reused from `@/types` (module-only shapes stay local).
- [ ] Mock fixture `public/data/<resource>.json` (pure record array,
      snake_case).
- [ ] UI gated with `<CanAccess>` / kit buttons; nav filtered by
      permission/feature.
- [ ] Docblocks throughout; `pnpm quality` + `pnpm test` green; conventional
      commit.
