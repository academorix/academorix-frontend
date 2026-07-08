# Academorix Frontend — Architecture

The workspace layer of the Academorix web platform: how apps, packages, and
deployment targets fit together. Complements — does not replace — the module
architecture in
[`.kiro/steering/frontend-module-architecture.md`](.kiro/steering/frontend-module-architecture.md),
which owns the in-app rules (modules, providers, resource pages, RBAC).

- **This doc** answers: what packages exist, where does new code go, how do the
  two apps stay in sync, what conventions are mandatory, how does the platform
  deploy.
- **Steering doc** answers: how a feature module inside an app is structured,
  what its file layout is, and which contracts it must respect.

Read this before any workspace-scale change (new package, new app, new
deployment target). Read the steering doc before any in-app change.

---

## 1. Precedence

Same rules as the steering doc apply. Where the two conflict, the more specific
rule wins:

1. `AGENTS.md` (workspace-wide baseline: pnpm-only, versions via catalog, HeroUI
   via `@academorix/ui`, `onPress` not `onClick`, `Separator` not `Divider`).
2. This file (workspace layer: packages, naming, deployment).
3. `.kiro/steering/frontend-module-architecture.md` (in-app module rules).
4. Package-local READMEs (implementation details of a single package).

Every workspace-scale change keeps `pnpm turbo run typecheck lint test build`
green across all packages and apps.

---

## 2. Workspace layout

```
frontend/
├── apps/
│   ├── dashboard/         # @academorix/dashboard   — tenant SPA (Vite + React 19 + Refine)
│   └── landing-page/      # @academorix/landing-page — marketing (Next.js 16)
│
├── packages/              # Shared capabilities. One package per capability.
│   ├── ui/                # @academorix/ui           — HeroUI OSS + Pro + icons + composites
│   ├── api-types/         # @academorix/api-types    — OpenAPI-generated backend types
│   ├── eslint-config/     # @academorix/eslint-config
│   ├── typescript-config/ # @academorix/typescript-config
│   │
│   ├── core/              # @academorix/core         — env<T>, defineConfig<T>, brand types
│   ├── i18n/              # @academorix/i18n         — LocaleProvider, useLocale, RTL, catalogs
│   ├── feature-flags/     # @academorix/feature-flags — defineFlags, FeatureProvider, useFeature
│   ├── analytics/         # @academorix/analytics    — Vercel/PostHog/Sentry adapters, useAnalytics
│   ├── http/              # @academorix/http         — axios factory, interceptors, HttpError
│   ├── query/             # @academorix/query        — React Query client + defineResource<T> hooks
│   ├── realtime/          # @academorix/realtime     — Reverb transport, useChannel, usePresence
│   ├── notifications/     # @academorix/notifications — Notification DTO, provider, hooks, SW helpers
│   └── pwa/               # @academorix/pwa          — buildManifest, workbox, Next+Vite adapters
│
├── e2e/                   # Playwright cross-app suites
├── brand/                 # Design-team masters (icon tile, mark, lockup, wordmark)
│
├── .kiro/                 # Kiro spec + steering + settings
├── AGENTS.md              # Workspace agent guide (versions, HeroUI, doppler)
├── ARCHITECTURE.md        # THIS FILE
├── PLAN.md                # Roadmap + architecture decisions log
├── pnpm-workspace.yaml    # Catalog (single source of truth for every version)
└── turbo.json             # Task graph (build/test/lint/typecheck)
```

- Adding a new capability shared between the two apps → **new package** under
  `packages/`.
- Adding a screen, feature, or module used by only one app → **inside the app**,
  following the steering doc.
- Adding a new consumer app (admin surface, mobile) → **new folder** under
  `apps/`. Never add sibling folders; the two-level layout is fixed.

---

## 3. Package boundaries — capability, not layer

Packages are cut by **capability**, not by technical layer. `@academorix/i18n`
owns everything about locales (types, provider, hooks, formatters, RTL). It does
NOT stop at "just types" or "just runtime" — that fragmentation is what led to
the re-export shims we deleted.

Rule of thumb:

- **Package** = a capability the two apps share exactly the same way.
- **App** = configuration values, event registries, routes, layouts, and any
  composition of packages that's product-specific.

### Package inventory

| Package                     | Owns                                                                                                                            | Consumers           | Peer dependencies                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------- |
| `@academorix/core`          | `env<T>()`, `defineConfig<T>()`, `Locale` brand types, `HttpError`, `assertNever`, ID brand utilities                           | Every package + app | none (zero-dep foundation)                          |
| `@academorix/i18n`          | `LOCALES`, `Locale`, `LOCALE_LABELS`, `RTL_LOCALES`, `isRtlLocale`, `LocaleProvider`, `useLocale`, `MessageCatalog`, formatters | Both apps           | `react`, `@academorix/core`                         |
| `@academorix/feature-flags` | `defineFlags<T>()`, `FeatureProvider`, `useFeature`, `envFlag()` helper, static registry + runtime override                     | Both apps           | `react`, `@academorix/core`                         |
| `@academorix/analytics`     | `<AnalyticsProvider>`, `useAnalytics`, `EventSchema<T>`, Vercel + PostHog + Sentry adapters, page view auto-tracking            | Both apps           | `react`, `@academorix/core`                         |
| `@academorix/http`          | `createHttpClient()` (axios), tenant/auth/version interceptors, `HttpError` normalization, retry + refresh loop                 | Both apps           | `@academorix/core`                                  |
| `@academorix/query`         | React Query client factory, `defineResource<T>()` returning `useList/useOne/useCreate/useUpdate/useDelete`                      | Both apps           | `@tanstack/react-query`, `@academorix/http`         |
| `@academorix/realtime`      | Reverb transport (Laravel Echo + pusher-js), `useChannel`, `usePresence`, `useBroadcast`                                        | Both apps           | `react`, `@academorix/core`                         |
| `@academorix/notifications` | `Notification` DTO, `<NotificationProvider>`, `usePushSubscription`, service-worker push helpers, category preferences UI hooks | Both apps           | `react`, `@academorix/http`, `@academorix/realtime` |
| `@academorix/pwa`           | `buildManifest()`, `getVitePwaOptions()`, `getSerwistOptions()`, workbox runtime-caching helpers, icon path constants           | Both apps           | none at runtime (build tools)                       |
| `@academorix/ui`            | HeroUI OSS + HeroUI Pro barrel, heroicons re-exports, shared composites (`AuthCard`, `MessageBar`, …)                           | Both apps           | React, HeroUI (workspace catalog)                   |
| `@academorix/api-types`     | OpenAPI-generated backend types + runtime schemas                                                                               | Both apps           | `openapi-fetch`, `openapi-typescript`               |

Nothing forces a package to ship both types and runtime — but the split happens
only when the types are needed at build time and the runtime pulls React. See
`@academorix/pwa` (build-only) vs `@academorix/i18n` (runtime).

### What is NOT a package

Kept per-app because it's app-specific configuration:

- **Event registries** — dashboard has 43 events, landing-page has ~15
  (different products, different events).
- **Feature flag defaults** — dashboard's flags gate CRUD modules, landing's
  gate marketing sections.
- **Manifest values** — name, description, shortcuts, start URL are per app.
- **Routes** — every route lives in its consuming app.
- **Refine integration** — dashboard uses Refine; landing does not.
- **App shell** — different layouts, different navigation.

Rule: package = capability shape, app = capability values.

---

## 4. File naming conventions

Every file has a purpose-declaring suffix so the tooling (and the reader) knows
what to expect before opening the file.

| Suffix           | Purpose                                       | Multiple exports per file allowed? |
| ---------------- | --------------------------------------------- | ---------------------------------- |
| `*.config.ts`    | Configuration values + `defineConfig()` calls | Yes — cluster related config       |
| `*.constant.ts`  | Frozen enums + magic strings                  | Yes — cluster related constants    |
| `*.util.ts`      | Pure functions                                | Yes — cluster related utils        |
| `*.interface.ts` | Shared TypeScript interfaces                  | Yes — cluster related interfaces   |
| `*.type.ts`      | Type aliases                                  | Yes — cluster related types        |
| `*.tsx`          | React components                              | **One component per file**         |
| `use-*.ts`       | React hooks                                   | **One hook per file**              |
| `*.provider.tsx` | React context providers                       | **One provider per file**          |
| `*.test.ts(x)`   | Vitest test files                             | Yes — one describe block per unit  |
| `*.module.tsx`   | Refine module manifest (dashboard only)       | **One module per file**            |

### When to split, when to cluster

**Cluster** when:

- Exports are semantically related (a config's constants and its inferred type
  live together).
- Splitting would create a barrel file that immediately re-exports everything it
  just imported.
- The file stays under ~250 lines.

**Split** when:

- File exceeds ~250 lines.
- One export has significantly heavier dependencies than the others and is
  imported alone often.
- Exports are semantically independent.

**Never**:

- Create one file per interface / type / constant. The `EVENTS` constant +
  `AnalyticsEvent` type + `AnalyticsEventKey` type all live in
  `analytics.config.ts`. Splitting them into 3 files is ceremony.
- Add a `*.constant.ts` file that only exports a single value already co-located
  with its consumer.

### File-name examples

```
src/config/i18n.config.ts          # Locale + storage keys + PWA translations
src/constants/http.constant.ts     # HTTP status ranges, retry limits
src/utils/date.util.ts             # formatDate, formatRelativeTime
src/interfaces/user.interface.ts   # User, UserProfile, UserPermissions
src/types/api.type.ts              # ApiEnvelope<T>, ApiError, ApiMeta
src/components/AuthCard.tsx        # One component
src/hooks/use-locale.ts            # One hook
src/providers/AnalyticsProvider.tsx # One provider
```

---

## 5. `defineConfig<T>()` — the typed passthrough pattern

Both apps and packages ship domain-specific `defineFooConfig()` helpers so
inline literals get structural inference and go-to-definition works.

### Zero-runtime passthrough (default)

```ts
// packages/core/src/config/define-config.ts

/**
 * Typed passthrough — identity function that ties the config literal to
 * `T` so IDE go-to-definition and autocomplete work at the call site.
 * Zero runtime cost; tree-shakes to nothing.
 */
export function defineConfig<T>(config: T): T {
  return config;
}
```

### Frozen, validated passthrough

```ts
// packages/feature-flags/src/define-flags.ts

export function defineFlags<T extends Record<string, boolean>>(
  flags: T,
): Readonly<T> {
  return Object.freeze(flags);
}
```

### Schema-validated passthrough (env / runtime input)

Use only for values that come from outside the compilation unit — env vars, URL
params, remote config. Do NOT use for build-time literals.

```ts
// Already shipped: apps/dashboard/src/config/env.config.ts
export function env<T>(key: string, defaultValue: T, schema?: z.ZodType<T>): T {
  // reads import.meta.env / process.env, Zod-validates, throws on invalid
}
```

### Third-party configs

For Vite, Next.js, vitest, tailwind, and `vercel.json` **use the tool's own
`defineConfig`** (or its documented recipe). Never wrap them — they already tie
the literal to the tool's own type.

```ts
// vite.config.ts — Vite's defineConfig, not ours.
import { defineConfig } from "vite";
export default defineConfig({/* ... */});
```

For our own domain configs — feature flags, analytics events, menus, onboarding
tours, PWA icons — a per-domain `defineFooConfig()` in the capability package.
The dashboard already does this via `defineFlags`, `defineEvents`, etc.

---

## 6. Data layer split — Refine (dashboard) + React Query (landing)

### Dashboard — Refine on top of `@academorix/query`

The dashboard is a CRUD-heavy multi-tenant app. Refine wires cache, mutations,
live provider, and RBAC. Under the hood Refine's `dataProvider` is built on top
of the same `httpClient` from `@academorix/http` that the landing page consumes
directly. One transport, two consumption patterns.

### Landing page — `@academorix/query` directly

The landing page is a Next.js marketing site. It calls two endpoints (contact
form, waitlist submission) and reads a handful of Server Component fetches for
pricing / plan data. Refine's 180 KB bundle earns nothing here.

`@academorix/query` ships a `defineResource<T>()` factory that generates the
same set of hooks Refine does — `useList`, `useOne`, `useCreate`, `useUpdate`,
`useDelete` — bound to the shared `httpClient`.

```ts
// apps/landing-page/src/api/waitlist.resource.ts
import { defineResource } from "@academorix/query";

import type { WaitlistEntry } from "@/interfaces/waitlist.interface";

export const waitlistResource = defineResource<WaitlistEntry>({
  path: "/marketing/waitlist",
});

// apps/landing-page/src/components/onboarding/waitlist-form.tsx
const { mutateAsync } = waitlistResource.useCreate();
```

Same shape, same ergonomics, no Refine dependency.

### Rule

Two apps, one HTTP transport (`@academorix/http`). Refine only on the dashboard.
Never install Refine on the landing page.

---

## 7. Deployment topology — two Vercel projects

Both apps deploy to Vercel. Each is its own Vercel project with its own
`vercel.json`.

| Vercel project         | Serves                                                                                      | Repo folder          |
| ---------------------- | ------------------------------------------------------------------------------------------- | -------------------- |
| `academorix-marketing` | `academorix.com`, `www.academorix.com`                                                      | `apps/landing-page/` |
| `academorix-frontend`  | `app.academorix.com`, `admin.academorix.com`, `*.academorix.com`, and custom tenant domains | `apps/dashboard/`    |

### Subdomain routing

Subdomain routing is a **DNS + Vercel domain-mapping** concern, not a
`vercel.json` rewrite one. Configure once per project:

- Root apex → `academorix-marketing`.
- `app.academorix.com` + wildcard `*.academorix.com` → `academorix-frontend`.
  The SPA's `resolveHostContext()` (see `apps/dashboard/src/lib/http/host.ts`)
  reads `window.location.hostname` at boot and decides whether the visitor is on
  the central host, the platform-admin host, or a tenant subdomain.

Custom tenant domains (e.g. `academy.example.com`) are added to the
`academorix-frontend` project via Vercel's domain UI. The backend resolves the
tenant from the request `Host` header via `stancl/tenancy`'s
`InitializeTenancyByDomain`.

### What each `vercel.json` owns

- `buildCommand`, `installCommand`, `outputDirectory` — scoped to the app's
  package via `pnpm --filter`.
- `rewrites` — SPA fallback for the dashboard (`/(.*) → /index.html`); none for
  landing (Next.js owns routing).
- `headers` — cache policy for static assets, security headers, CSP.

Do NOT put subdomain-specific behavior in `vercel.json`. If a route needs
different behavior per host, resolve it at runtime via `resolveHostContext()`
(dashboard) or middleware (landing-page).

### CSP + security headers

Both apps ship the same security-header baseline; the CSP source lives in
`@academorix/pwa/security` so bumping a directive updates both apps.

Baseline directives:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` (admin surfaces) / `SAMEORIGIN` (marketing)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` — app-specific: dashboard allows the API origin +
  Reverb WebSocket; landing allows the analytics origin + iframe embed targets.
  Both use nonces on inline scripts.

The dashboard ships its CSP from `apps/dashboard/vercel.json`, covering `'self'`
for scripts + styles + images, `https://*.academorix.app` and
`wss://*.academorix.app` for the tenant API + Reverb WebSocket connection, and
`https://us.i.posthog.com` + `https://vitals.vercel-insights.com` on the
`connect-src` for PostHog product analytics + Vercel Web Vitals. The landing
page ships its own CSP from `apps/landing-page/next.config.ts` via the Next.js
`headers()` hook (analytics CSP origins are sourced from
`apps/landing-page/src/config/analytics.config.ts`, so adding a provider is a
one-file change). The follow-up is to centralise the CSP source-of-truth into
`@academorix/pwa/security` so a single directive bump updates both apps.

---

## 8. Adding a new package

Enterprise-day-1 checklist for a new `packages/<name>/`:

```
packages/<name>/
├── package.json                # name: @academorix/<name>, version 0.0.0
├── tsconfig.json               # extends @academorix/typescript-config
├── src/
│   ├── index.ts                # Public barrel — only the surface consumers use
│   ├── config/                 # If the package has any config
│   ├── constants/              # Frozen enums + magic strings
│   ├── utils/                  # Pure functions
│   ├── interfaces/ types/      # Shared TS shapes
│   ├── hooks/                  # React hooks
│   ├── components/             # React components
│   └── providers/              # React providers
└── README.md                   # One-paragraph description, install snippet, one usage example
```

Then:

1. Add the package to `pnpm-workspace.yaml` (already covered by `packages/*`).
2. Add its dependencies to `pnpm-workspace.yaml`'s `catalog:` if new.
3. Add `"@academorix/<name>": "workspace:*"` to consuming apps' `package.json`.
4. Add the package to `turbo.json`'s pipeline outputs if it produces build
   artifacts (most packages don't — JIT is fine).
5. Run `pnpm install` at the workspace root.
6. Write **the public API first** (types, factory signatures) in `src/index.ts`
   with heavy TSDoc, then fill in implementation.
7. Consumer apps start importing from `@academorix/<name>` incrementally.
8. Add a section to this doc's package inventory (§3).

---

## 9. Adding an environment variable

- **Which app** — pick the app's `src/config/env.config.ts`.
- Add an entry to the `envConfig` object using `env(key, default, schema?)`.
- **Never** `process.env.FOO` or `import.meta.env.FOO` at random call sites —
  always through `envConfig.foo`.
- Update the app's `.env.example` with the new key (schema hint in the comment).
- If the value should be different per environment, update Doppler
  (`academorix-frontend` / `academorix-marketing` projects, `dev` / `stg` /
  `prd` configs).

---

## 10. Migration path — packaging existing app code

Existing dashboard config files (`src/config/*.config.ts`) migrate to the
capability packages in this order:

1. **`@academorix/core`** — extract `env<T>()` and `defineConfig<T>()` (already
   exist in each app; move to the package, import back).
2. **`@academorix/i18n`** — extract `Locale`, `LOCALES`, predicates,
   `LocaleProvider`, `useLocale`, formatters. Apps re-import the same names.
3. **`@academorix/http`** — extract the axios factory + interceptors from
   `apps/dashboard/src/lib/http/`. Refine dataProvider on top.
4. **`@academorix/feature-flags`** — extract `defineFlags`, `useFeature`,
   `envFlag` helper.
5. **`@academorix/analytics`** — extract provider adapters + `useAnalytics`
   hook. Event registry stays per-app.
6. **`@academorix/pwa`** — extract `buildManifest()`, workbox helpers,
   `getVitePwaOptions()`, `getSerwistOptions()`. Apps stay as thin consumers.
7. **`@academorix/query`** — extract `defineResource<T>()` factory. Landing
   page's marketing forms adopt it.
8. **`@academorix/realtime`** — extract Reverb transport + hooks.
9. **`@academorix/notifications`** — extract Notification DTO, provider, push
   helpers.

Each migration is:

- One commit per package skeleton (empty API surface with TSDoc).
- One commit per app-side migration (dashboard, then landing-page).
- Verification (`pnpm turbo run typecheck lint test build`) between each.

---

## 11. Cross-links

- Workspace agent guide → [`AGENTS.md`](./AGENTS.md)
- Product plan → [`PLAN.md`](./PLAN.md)
- Module architecture (in-app) →
  [`.kiro/steering/frontend-module-architecture.md`](.kiro/steering/frontend-module-architecture.md)
- Desktop rollout plan →
  [`apps/dashboard/DESKTOP_PLAN.md`](apps/dashboard/DESKTOP_PLAN.md)
- Desktop ops runbook →
  [`apps/dashboard/DESKTOP_OPS.md`](apps/dashboard/DESKTOP_OPS.md)
- Dashboard UX spec →
  [`apps/dashboard/DASHBOARD_UX_PLAN.md`](apps/dashboard/DASHBOARD_UX_PLAN.md)

Subsystem implementations (own their own docblocks in code — no separate plan MD
anymore):

- Notifications → `apps/dashboard/src/notifications/**` +
  `apps/dashboard/src-tauri/src/notification.rs`
- Onboarding → `apps/dashboard/src/onboarding/**` +
  `apps/dashboard/src/modules/dashboard/widgets/onboarding-checklist/`
- Menus → `apps/dashboard/src/menus/**` +
  `apps/dashboard/src/config/menu.config.ts` +
  `apps/dashboard/src-tauri/src/menu.rs`
