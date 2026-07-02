# Academorix Frontend — Plan & Roadmap

> Living tracking document for the Academorix web frontend. Check items off as
> they land. Keep the "Architecture Decisions" section as the source of truth
> for _why_ the stack looks the way it does.
>
> Legend: `[x]` done · `[~]` in progress · `[ ]` not started.

---

## 1. Overview

- **Repo:** `academorix/academorix-frontend` (standalone, public). Web only.
- **Live:** https://academorix.vercel.app (Vercel team `academorix`, Hobby).
- **Backend:** separate Laravel repo (`../backend`). REST + Sanctum tokens +
  Reverb (WebSockets). Not yet publishing an OpenAPI spec.
- **Stack:** pnpm workspaces + Turborepo · Vite 8 + React 19 SPA · HeroUI
  (OSS) + HeroUI Pro · Refine (headless) on TanStack Query · Doppler for
  env/secrets.

---

## 2. Architecture Decisions (locked)

These are settled. Revisit only with a documented reason.

| Area             | Decision                                                                                                                                    | Rationale                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Data layer**   | **Refine** (`@refinedev/core`, headless) on top of TanStack Query — used everywhere, incl. the public landing route.                        | CRUD + RBAC + realtime-heavy academy OS. Refine standardizes auth/list/mutation/live plumbing; runs on TanStack Query so we keep its cache. One provider tree for the whole app = consistency. |
| **UI**           | **HeroUI Pro** app shell (`AppLayout` + `Sidebar` + `Navbar`) + HeroUI OSS, all via `@academorix/ui`. Refine stays headless; we own the UI. | Committed design system. Headless Refine + HeroUI is a first-class pattern.                                                                                                                    |
| **Transport**    | **REST** (not GraphQL).                                                                                                                     | Laravel-native (API Resources, Sanctum, form requests). Reverb covers realtime, so no need for GraphQL subscriptions.                                                                          |
| **Auth**         | **Token auth** (Sanctum tokens), token held **in memory** with a refresh path (not raw `localStorage`).                                     | Token mode keeps mobile parity open. In-memory storage reduces XSS blast radius.                                                                                                               |
| **Codegen**      | **`openapi-typescript` + `openapi-fetch`** for **types only** (not hook generation). `@hey-api/openapi-ts` is the fallback. **Not** Orval.  | Refine owns fetching; generating query hooks would duplicate/compete with it. We only need typed models + a typed fetch instance.                                                              |
| **Mock backend** | **JSON-file mock data provider** reading `apps/web/public/data/*.json`, switched by `VITE_API_MOCK`.                                        | Lets us build the full UI before the Laravel API is ready; flip one env flag to go live.                                                                                                       |

---

## 3. Current Status

### Done

- [x] **Monorepo** — pnpm workspaces + Turborepo. `apps/web`, `packages/ui`,
      `packages/eslint-config`, `packages/typescript-config`. All dep versions
      in the pnpm **catalog**.
- [x] **HeroUI Pro** installed (`@heroui-pro/react`) + `.ref/ui` web surface
      ported into `@academorix/ui` (react/core/icons + composites).
- [x] **Deploy** — GitHub repo created, pushed, Vercel Git auto-deploy wired
      (public repo + `HEROUI_AUTH_TOKEN` set so the build's postinstall passes).
- [x] **Doppler** — project `academorix-frontend` (`dev`/`stg`/`prd`),
      `doppler.yaml` at root; **source of truth** for env. `prd` holds the two
      HeroUI tokens + the `VITE_*` vars (Vercel system vars scrubbed out).
- [x] **Multi-root workspace** — `academorix.code-workspace` (🎨 frontend / ⚙️
      backend), Material icons, per-language formatters, ESLint flat config,
      Tailwind v4, recommended extensions, tasks.
- [x] **Tooling** — ESLint flat, Prettier (width 100), knip, Vitest, Husky +
      lint-staged + commitlint, Playwright e2e, size-limit, `AGENTS.md`.
- [x] **Architecture decisions** locked (section 2).

---

## 4. Done — Refine Data Layer (day-1, production-grade)

Full provider set + REST **and** JSON-mock data providers with an env switch,
wired into a `<Refine>` app with a login page and one example resource. Every
file carries heavy docblocks + inline comments. All quality gates green.

- [x] **1. Dependencies + mock env flag** — catalog + `apps/web/package.json`
      updated (`@refinedev/core`, `@refinedev/react-router`,
      `@tanstack/react-query`, `laravel-echo`, `pusher-js`, `openapi-fetch`,
      `openapi-typescript`); **React Router upgraded to v7**. `VITE_API_MOCK`
      added to env + zod schema + `vite-env.d.ts` + `.env*`.
- [x] **2. Typed HTTP client + token store** — `src/lib/http/` (Bearer
      injection, 401 → token clear, `ApiError` = Refine `HttpError`) + in-memory
      token store with session-storage persistence.
- [x] **3. Auth provider** — token `authProvider` (REST) + mock, shared identity
      mapper + session cache + selector.
- [x] **4. Data providers** — Laravel REST provider + JSON-mock provider
      (client-side filter/sort/paginate + in-memory CRUD via `mock-query`) + env
      selector.
- [x] **5. Live provider** — Reverb via `laravel-echo` + `pusher-js`
      (lazy-loaded so it stays out of the initial bundle); no-op in mock mode.
- [x] **6. Notification + access-control providers** — HeroUI `toast` mapped to
      Refine `open`/`close` (incl. undoable); permission-based
      `accessControlProvider` reading the session cache.
- [x] **7. Mock datasets** — `apps/web/public/data/`: `me.json` +
      `students`/`coaches`/`courses`/`teams`/`branches`/`users` JSON, shaped to
      the backend identity/tenancy spec.
- [x] **8. Wire the Refine app** — `<Refine>` + all providers + `resources`; `/`
      public landing, `/login`, authenticated shell (**HeroUI Pro `AppLayout` +
      `Sidebar` + `Navbar`**), and a students list built on **HeroUI Pro
      `DataGrid`** via `useTable`. Routes are code-split (lazy).
- [x] **9. OpenAPI codegen** — `pnpm codegen` script + typed `openapi-fetch`
      client + stub schema, ready to activate when the backend ships a spec.
- [x] **10. Verify + ship** — `pnpm quality` + `pnpm test` + `pnpm size` all
      green; conventional commit + push.

---

## 5. Infrastructure / DevOps

- [ ] **Doppler → Vercel integration** — connect the native integration (Doppler
      dashboard → Integrations → Vercel → `academorix-frontend`/`prd`). Then
      drop committed `.env.production` in favor of Doppler-injected `VITE_*`, so
      Doppler is the single source for builds too.
- [ ] **GitHub Actions CI** — on PRs run `pnpm quality` + `pnpm test`, plus
      `playwright install` + `pnpm e2e`. Moves checks beyond local hooks +
      Vercel.
- [ ] **Frontend MCP config** — create `frontend/.kiro/settings/mcp.json`
      (gitignored). Pull the HeroUI token from Doppler rather than hardcoding:
      `doppler secrets get HEROUI_PERSONAL_TOKEN -p academorix-frontend -c prd --plain`.

---

## 6. Security

- [ ] **Rotate the leaked HeroUI token** — `backend/.kiro/settings/mcp.json` was
      committed (token is in backend git history). Regenerate the token in the
      HeroUI dashboard, update Doppler + Vercel.
- [ ] **Commit the backend untrack** — the `git rm --cached` of
      `backend/.kiro/settings/mcp.json` is staged; commit it in the backend
      repo.
- [x] **Gitignore local MCP secrets** — `.kiro/settings/mcp.json` ignored in
      both repos.

---

## 7. Product Milestones (after the data layer)

Sequenced, not yet scheduled.

- [x] **Auth flow** — login/logout, protected routes, and identity + permissions
      surfaced in the shell (user dropdown). Works end-to-end in mock mode;
      swaps to Sanctum tokens when `VITE_API_MOCK=false`.
- [ ] **Core resources** — model the academy domain and build list/detail/form
      pages: students, staff, courses, cohorts/classes, schedules, attendance,
      grades, invoices.
- [ ] **RBAC** — real `accessControlProvider` backed by Laravel
      policies/permissions; `useCan` / `<CanAccess>` gating in the UI.
- [ ] **Realtime** — live-mode wiring on the resources that need it (attendance,
      notifications) via the Reverb live provider.
- [ ] **Dashboards** — KPIs + charts (HeroUI Pro chart components) for academy
      overview.
- [ ] **OpenAPI integration** — when the backend publishes a spec, run
      `pnpm codegen`, replace stub types, and type the REST data provider +
      `useCustom` calls end-to-end.
- [ ] **SEO note** — a Vite SPA landing has weak SEO. If marketing SEO becomes
      important, split off a separate static/SSG marketing site (the app stays
      unified on Refine).

---

## 8. Reference

- Agent/contributor guide: [`AGENTS.md`](./AGENTS.md).
- Env vars: `apps/web/environments/` (validated in
  `apps/web/src/config/env.ts`).
- Commands: `pnpm dev` · `pnpm build` · `pnpm test` · `pnpm e2e` ·
  `pnpm quality` · `pnpm size`.
