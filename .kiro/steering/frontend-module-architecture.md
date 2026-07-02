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
├── app/                     # app-level wiring, not feature code
│   ├── module.ts            # AppModule / AppModuleRoute types
│   ├── registry.ts          # import.meta.glob aggregation of *.module.tsx
│   └── routes.ts            # cross-cutting redirect targets only (LOGIN, HOME…)
├── modules/<domain>/        # one folder per bounded context (mirrors backend)
│   ├── pages/               # route screens (lazy-loaded)
│   ├── components/          # module-only components (optional)
│   ├── hooks/               # module-only hooks (optional)
│   ├── <domain>.types.ts    # module-only types (optional; shared shapes → @/types)
│   └── <domain>.module.tsx  # THE manifest: resources + routes (default export)
├── providers/               # Refine providers (data/auth/live/notification/access)
├── lib/                     # infra only: http, api client, query builders
├── components/              # shared UI: layout shell, shared widgets
├── config/                  # env, site (NOT routes — those live per module)
└── types/                   # cross-module domain types, enums, API envelopes
```

- Create only the folders a module needs; do not scaffold empty layers.
- Module names are lowercase and match the backend (`organization`, `athletes`,
  `auth`, `billing`, …).

---

## 3. The module manifest (`<domain>.module.tsx`)

Each module default-exports one `AppModule`. It declares its **Refine
resource(s)** and its **routes**. Nothing else in the app hard-codes routes or
resources.

```ts
// src/app/module.ts
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
  icon?: ReactElement;
  /** Tenant feature-toggle key; hidden unless the manifest enables it. */
  featureKey?: string;
  /** Permission required to see/enter, e.g. "athletes.viewAny". */
  requiredPermission?: string;
  /** Optional nav group / parent resource name. */
  parent?: string;
}

/** A feature module: its Refine resources + its routes. */
export interface AppModule {
  name: string;
  resources?: ResourceProps[];
  routes?: AppModuleRoute[];
}
```

```tsx
// src/modules/athletes/athletes.module.tsx
import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { createElement, lazy } from "react";

import type { AppModule } from "@/app/module";

const AthleteListPage = lazy(
  () => import("@/modules/athletes/pages/athlete-list-page"),
);

const athletesModule: AppModule = {
  name: "athletes",
  resources: [
    {
      name: "athletes",
      list: "/athletes",
      meta: {
        label: "Athletes", // default; overridden by tenant terminology
        icon: createElement(AcademicCapIcon, { className: "size-5" }),
        featureKey: "athletes",
        requiredPermission: "athletes.viewAny",
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

## 4. The registry (glob aggregation)

The registry discovers every `*.module.tsx` with Vite's `import.meta.glob`
(eager — manifests are tiny; the page components inside stay lazy). `App.tsx`
and `providers.tsx` consume the registry; neither imports modules directly.

```ts
// src/app/registry.ts
import type { AppModule, AppModuleRoute } from "@/app/module";
import type { ResourceProps } from "@refinedev/core";

const manifests = import.meta.glob<{ default: AppModule }>(
  "@/modules/*/*.module.tsx",
  {
    eager: true,
  },
);

export const appModules: AppModule[] = Object.values(manifests).map(
  (m) => m.default,
);

export const appResources: ResourceProps[] = appModules.flatMap(
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
- Query contract: `page`, `per_page`, spatie-style `sort=-created_at,name`,
  `filter[field]=` / `filter[field][op]=` (see `lib/query/laravel-query.ts`).

---

## 7. Screens & styling

- Import UI from `@academorix/ui/react`; icons from
  `@academorix/ui/icons/{outline,solid,mini,micro}`. Never `@heroui/*` directly.
- **Resource tables use HeroUI Pro `DataGrid`** (config-driven columns +
  controlled sort bridged to Refine `sorters`); pagination is a separate
  `Pagination` footer wired to `useTable`.
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
- Tenant branding (logo, colors) and locale/RTL come from the manifest/tenant
  and are applied in the shell + theme. (i18n with en/ar + RTL is a planned
  Refine `i18nProvider`.)

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
- [ ] `pages/` screens (lazy), built with HeroUI Pro + Refine headless hooks.
- [ ] `<domain>.module.tsx` default-exports an `AppModule` (resources + routes).
- [ ] Resource `meta` sets `label`, `icon`, `featureKey`, `requiredPermission`.
- [ ] Domain shapes reused from `@/types` (module-only shapes stay local).
- [ ] Mock fixture `public/data/<resource>.json` (pure record array,
      snake_case).
- [ ] UI gated with `<CanAccess>`; nav filtered by permission/feature.
- [ ] Docblocks throughout; `pnpm quality` + `pnpm test` green; conventional
      commit.
