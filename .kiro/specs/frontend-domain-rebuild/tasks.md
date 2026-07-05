# Frontend Domain Rebuild — Tasks

Dependency-ordered, grouped by the blueprint's build waves. Each wave ends with
all gates green (build, lint, knip, format, test, size) and a conventional
commit. Requirement references point to `requirements.md`.

## Wave 0 — Foundations

- [x] 1. Reorganize types into `src/types/` folders (platform, access, people,
      structure, scheduling, development, commerce, attributes, api, enums) and
      re-export from `index.ts`; migrate existing imports. _(R1, R6)_
- [x] 2. Expand `enums.ts` with all blueprint enums + `*_LABELS` (event/match
      status, RSVP, invoice/payment status, staff employment/status, season
      status, scoring types, capability keys, etc.). _(R1)_
- [x] 3. Model the hierarchy types: `Tenant`, `Region`, `Organization`,
      `Branch`, `Season`, plus `AllowedScopes` and expanded `Identity` (tenants,
      scopes). _(R1, R2, R4)_
- [x] 4. Build `src/lib/scope/` — types, `scope-storage`, `scope-context` +
      `ScopeProvider` (persist/validate/default), `use-scope`, `use-tenant`,
      barrel. _(R2)_
- [x] 5. Build `providers/data/scope-filter.ts` (get/set active scope) and wire
      scope filters into REST + mock `getList` for a resource's `scopedBy`
      dimensions; add `scopedBy` to `AppResourceMeta`. _(R2, R3)_
- [x] 6. Build `src/components/scope/` switchers (tenant/org/branch/season) and
      mount them in `authenticated-layout`; wrap the protected area with
      `ScopeProvider` in `App.tsx`. _(R2, R9)_
- [x] 7. Build `src/lib/attributes/` — types, `use-attribute-set`,
      `attribute-field`, `attribute-form`, `attribute-view`, barrel. _(R5)_
- [x] 8. Expand `me.json` with `features`, `terminology`, `tenants`, `scopes`;
      update `Identity` + `map-identity.ts`. _(R4)_
- [x] 9. Remove legacy `courses` module + fixture + type refs; `git mv` sports
      dirs into `modules/sports/{athletes,teams}` and `modules/sports/coaching`;
      keep `modules/branches` (platform). Fix imports. _(R8)_
- [x] 10. Platform modules: `tenancy` (context only), `organization` (L/S +
      switcher source), `branches` (L/C/E/S), `regions` (L/S). Fixtures:
      `organizations.json`, `branches.json`, `regions.json`. _(R1, R6, R7)_
- [x] 11. Sport `registry` module: `sports` (L/S) + `tenant-sports` overlay;
      fixtures `sports.json`, `tenant-sports.json`, and `attribute-sets.json`
      (athlete enrollment sets for ≥2 sports). _(R1, R5, R7)_
- [x] 12. `attributes` admin module (list/show of sets) + `documents` /
      `notifications` placeholders. _(R5, R6)_
- [x] 13. Update steering (scope layer, sports sub-domain layout,
      attributes/SDUI, module map); run all gates; commit Wave 0. _(R8, R10)_

## Wave 1 — Structure, acquisition, money, people

- [x] 14. `sports/seasons` — L/C/E/S + `SeasonSwitcher` data source;
      `seasons.json`. _(R1, R2)_
- [x] 15. `sports/athletes` — L/C/E/S with typed identity + **SDUI enrollment**
      block (attribute set by `sport_key`); guardians/documents sections;
      `athletes.json`, `athlete-enrollments.json`. _(R1, R5)_
- [x] 16. `sports/teams` — L/C/E/S + roster/members; `teams.json`,
      `team-members.json`. _(R1)_
- [x] 17. `sports/registrations` — funnel L/S; `registrations.json`. _(R1)_
- [x] 18. `sports/events` — L/C/E/S + RSVP surface; `events.json`,
      `event-invitations.json`. _(R1)_
- [x] 19. `payments` — invoices L/S + refund action; `invoices.json`,
      `payments.json`. `memberships` — L/C/E/S; `memberships.json`. _(R1)_
- [x] 20. `staff` — L/C/E/S (employment/pay/docs); `staff.json`. `users` —
      L/C/E/S; `users.json`. `access` — roles/permissions L/S; `roles.json`,
      `permissions.json`. _(R1, R4)_
- [x] 21. `reception` (approval queue), `admin` shell, `billing` subscription
      view, `people` placeholder, `facilities` (feature-flagged). Fixtures as
      listed in design §2. _(R1, R6)_
- [x] 22. Run all gates; commit Wave 1.

## Wave 2 — Activities, participation, cost, check-in

- [x] 23. `sports/coaching` (`coaches`, view over staff) — L/S;
      `coach-assignments.json`. _(R1)_
- [x] 24. `sports/training`, `sports/matches`, `sports/sessions` — L/C/E/S;
      fixtures per design. _(R1)_
- [x] 25. `sports/attendance` — capture surface (event/session pre-fill);
      `attendance.json`. _(R1)_
- [x] 26. `sports/progress` — skill cards with **SDUI** + belt/grading;
      `progress.json`, progress attribute sets. _(R5)_
- [x] 27. `expenses` (receipts/recurring/payroll) — L/C/E/S; `credentials`
      (NFC/RFID) — L/S. Fixtures per design. _(R1)_
- [x] 28. `announcements` — L/C/E/S; `messaging` — thread surface. _(R1)_
- [x] 29. Run all gates; commit Wave 2.

## Wave 3 — Development, competition, content, compliance, AI

- [x] 30. `sports/performance` (SDUI tests), `sports/medical` (restricted),
      `sports/development`, `sports/drills`. _(R1, R5)_
- [x] 31. `sports/competition` (team + individual standings),
      `sports/formations` (builder), `sports/safeguarding`. _(R1)_
- [x] 32. `reports` (dashboards), `leads` (CRM pipeline), `ai` (flagged
      placeholder). _(R1)_
- [x] 33. Run all gates; commit Wave 3.

## Wave 4 — Reach & polish

- [x] 34. `integrations` (webhooks/connectors), offline-sync affordances,
      `passes`, `awards`, `public-site` CMS. _(R1)_
- [x] 35. i18n groundwork (en/ar + RTL) via a Refine `i18nProvider` and
      terminology; final gates; commit Wave 4.

## Cross-cutting (every task)

- Compose the `@/components/refine` kit + Refine headless hooks; no bespoke
  table or action-bar plumbing. _(R6)_
- Create/edit share one controlled form per resource in the module's
  `components/`. _(R6)_
- Fixtures: pure snake_case record arrays, FK-consistent, scope columns aligned
  to `me.json`; no embedded `meta`. _(R7)_
- Docblocks on every file/type/symbol/provider/hook; inline comments for
  non-obvious logic. _(R6)_
- Keep authz/features/terminology data-driven from `/auth/me`. _(R4)_

## Wave 5 — Production hardening (RBAC, personas, landing, write surfaces)

- [x] 36. Multi-user demo personas: `demo-users.json` (owner, admin, head_coach,
      coach, reception, finance, medical_officer) with differentiated
      permissions + features; mock auth resolves the persona by login email and
      persists it across reloads (`me.json` kept as the owner fallback). _(R4)_
- [x] 37. Demo persona quick-login switcher on the login page (reads
      `demo-users.json`, one click signs in as any role). _(R4)_
- [x] 38. Central RBAC page guards: `components/access/` (`ResourceAccessGuard`
      via Refine `useCan` + `AccessDenied`), wrapping the List/Show/Create/Edit
      view scaffolds so every resource page is authorization-gated by action
      (closes the direct-URL gap; nav already filters by feature + permission).
      _(R4)_
- [x] 39. Full marketing landing page: header + hero + logo strip + features +
      sports + how-it-works + pricing + testimonials + CTA + footer, composed
      from section subcomponents under `modules/landing/components/`. _(R1)_
- [x] 40. Create/edit write surfaces for every read-only module (development,
      drills, competition, formations, leads, passes, integrations, public-site,
      performance, medical, safeguarding, awards): shared controlled form +
      create/edit pages + CRUD routes + list `EditButton`. _(R1, R6)_
- [x] 41. Docs: tick this task list and refresh steering (RBAC personas, i18n,
      module map); run all gates; commit + push Wave 5, open PR. _(R10)_

> Note: `sports/formations` create/edit covers metadata (name/shape/sport/team/
> note); on-pitch slot-geometry authoring and per-test SDUI value editing
> (performance) are tracked follow-ups. All write surfaces target the mock
> provider today and swap to the REST API unchanged.

## Wave 6 — Backend/frontend alignment (Phase 1–4 of PLAN.md)

Executes the deliverables in `.kiro/specs/backend-frontend-alignment/PLAN.md`
Phases 1–4. Phases 5–9 depend on backend gaps (G1, G2, G6, G7, G8, G9, G10)
landing; the frontend structure is in place to consume them the moment they
ship.

- [x] 42. **Phase 1** — HTTP layer rebuild (`src/lib/http/`): host resolver
      (`resolveHostContext`, `buildTenantUrl`, `buildCentralUrl`), device
      headers (`getDeviceId`, `deviceHeaders`, `deviceLabel`), envelope helpers
      (`unwrapEnvelope`, `extractPaginationMeta`), single-flight refresh
      coordinator, and a rewritten `HttpClient` that carries the full backend
      header contract (`X-Api-Version`, `X-Client`, `X-Device-*`, `X-Timezone`,
      `X-Locale`, `Authorization`).
- [x] 43. **Phase 1** — Tenancy library (`src/lib/tenancy/`): `TenancyProvider`
      resolves the current tenant via `GET /api/current-tenant`; `useTenancy()`
      returns `{host, tenant, isCentral, isTenant, isCentralAdmin, …}`;
      `useMyWorkspaces()` powers the Slack-style picker.
- [x] 44. **Phase 1** — `config/env.ts` extended with `VITE_API_PATH`,
      `VITE_CENTRAL_HOST`, `VITE_PLATFORM_ADMIN_HOST`; `vite.config.ts` injects
      `__ACADEMORIX_VERSION__` for the `X-Client` header.
- [x] 45. **Phase 2** — Split auth providers: `auth-provider.tenant` (POST
      `/auth/*` + companion `TenantAuthApi` for register/forgot/reset/
      email-verify/confirm/change), `auth-provider.platform` (POST
      `/v1/platform/auth/*` + `PlatformAuthApi` for 2FA + impersonation),
      updated `auth-provider.mock`. `providers/auth/index.ts` picks the provider
      by host + `VITE_API_MOCK`.
- [x] 46. **Phase 2** — Identity layer aligned with backend DTOs: `types/api.ts`
      matches `AuthTokenData` (`access_token`, `token_type`, `abilities`,
      `risk_score`, `expires_at`, `user`, `two_factor_setup_required`) plus
      `TwoFactorRequiredResponse` + `isTwoFactorRequired` discriminator.
      `map-identity` has `toIdentity(rich AuthUser)` +
      `synthesizeIdentityFromMinimalUser` fallback for when `/me` (gap G1) has
      not shipped yet. `session.ts` carries the impersonation state
      (sessionStorage-scoped). `password-policy.ts` mirrors backend.
- [x] 47. **Phase 2** — All auth pages: `login` (unchanged), `register`,
      `forgot-password`, `reset-password`, `verify-email`,
      `verify-email-notice`, `confirm-password`, `change-password`,
      `two-factor-challenge`, `two-factor-setup`, plus `AuthCard`,
      `PasswordChecklist`, and `ImpersonationBanner`. Auth manifest registers
      all 11 routes.
- [x] 48. **Phase 3** — Multi-data-provider wiring. `providers/data/index.ts`
      exports `dataProviders: { default, mock }` (Refine multi-provider map).
      `BACKEND_READY_RESOURCES = new Set(["tenants", "features"])` allow-list;
      the registry auto-applies `meta.dataProviderName = "mock"` for any
      resource NOT in the list, so migrating a resource to the real API is a
      single edit — add its name to the list.
- [x] 49. **Phase 3** — Fixtures aligned with backend DTOs: `login.json`
      (AuthTokenData), `tenants.json` (TenantData collection), `tenant.json`
      (single TenantData envelope), `features.json`, `workspaces.json`.
- [x] 50. **Phase 4** — Workspace module (central host): Slack-style
      `workspace-picker` (grid of workspaces, powered by `useMyWorkspaces`),
      `create-workspace` (self-serve tenant provisioning; posts to backend gap
      G5's endpoint), `find-workspaces` (email me my list; gap G4).
- [x] 51. **Phase 4** — Host-aware route filtering: `AppModuleRoute` gained
      `hosts?: HostKind[]`; the registry filters routes by
      `resolveHostContext().kind`. Landing module gated to tenant hosts;
      workspace module gated to central/central-admin hosts. `App.tsx` mounts
      `<TenancyProvider>` above all routes. Impersonation banner mounted in the
      authenticated shell.
- [x] 52. Docs refresh (steering + spec), run all gates, commit + push + merge
      to main.

**Backend gaps documented for the backend team** (`PLAN.md` §8): G0 CORS
origins, G1 `/me`, G2 seed permissions/roles, G3 workspaces list, G4
find-workspaces, G5 self-serve tenant creation, G6 Organization module, G7
device headers, G8 `user_sessions` recorder, G9 tenant 2FA, G10 SPA features
endpoint, G11 wildcard CORS, G12 exposed API-version header, G13 password-policy
config.
