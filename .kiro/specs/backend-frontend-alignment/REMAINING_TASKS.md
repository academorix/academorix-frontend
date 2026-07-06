wh# Remaining Tasks — Backend/Frontend Alignment

_Persistent tracker for every outstanding item across backend + frontend + ops.
Waves 0–7 are complete (see `frontend-domain-rebuild/tasks.md`)._

_Snapshot: 2026-07-05._

## Wave 8 — Frontend polish (no backend deps)

Ships against today's backend. All items can proceed in parallel.

- [ ] 61. Rewrite `/pricing` to Vercel-style — hero, plan cards with derived
      highlights, full feature-comparison matrix from `PlanTier.grants` (grouped
      by client-side category map), FAQ section, sticky compare header. CTA copy
      per tier (Enterprise → "Contact sales" heuristic).
- [ ] 62. Test coverage for the shared billing UI:
      `subscription-banner.test.tsx`, `quota-meter.test.tsx`,
      `subscription-status.test.ts` (`bannerFor` per lifecycle state),
      `use-subscription.test.ts`.
- [ ] 63. Test coverage for the billing hooks + pages: `use-billing.test.ts`
      (mocks `httpClient`), `settings-page.test.tsx` (renders per state),
      `pricing-page.test.tsx` (catalog + toggle + CTA branch).
- [ ] 64. Test coverage for entitlements: `use-entitlements.test.ts`,
      `entitlements/pages/list.test.tsx`.
- [ ] 65. Clean up legit knip unused-export warnings (or move exports to
      `internal` files).
- [ ] 66. SEO metadata on public pages: `<title>` +
      `<meta name="description">` + OG tags on `/`, `/pricing`,
      `/create-workspace`, `/login`, `/find-workspaces`.
- [ ] 67. Run all gates + commit + push + PR + merge.

## Wave 9 — Backend easy wins

Small, self-contained backend changes that unblock frontend work.

- [ ] 68. **G10** — register `TenantFeaturesController` route:
      `Route::middleware(['auth:sanctum', 'tenant'])->get('/v1/features',     TenantFeaturesController::class)`
      in `modules/FeatureFlag/routes/api.php`.
- [ ] 69. **G2** — seed `manage_billing` + `view_billing` permission rows in
      `modules/Auth/database/seeders/AuthPermissionSeeder.php` under the
      `sanctum` guard.
- [ ] 70. **G2b** — seed the full permission catalog from
      `BusinessType::defaultRoles()` + assign per role.
- [ ] 71. **G11** — verify `allowed_origins_patterns` CORS wildcard for
      `*.academorix.app` is committed to `origin/main` (per handoff §3 it landed
      locally but was not yet committed).
- [ ] 72. **G12** — verify `X-Api-Version` in `exposed_headers`.
- [ ] 73. Commit + push the uncommitted `/me` DTOs (`MeData`, `PlatformMeData`,
      `UserProfileData`, `TenantSummaryData`, `AllowedScopesData`,
      `QuotaHeadlineData`, both `MeController`s) + the migration renumber + CORS
      config changes per handoff §3.
- [ ] 74. Feature tests for `/me` (tenant + platform): 200 shape assertion, 401
      unauthenticated, platform variant returns `is_platform_admin: true`.

## Wave 10 — Backend observability + tenant provisioning polish

Medium effort. Needed before Phase 6 lands on the FE side.

- [ ] 75. **G7** — Foundation middleware reads `X-Client`, `X-Device-Id`,
      `X-Device-Name`, `X-Device-Platform`, `X-Device-Type`, `X-Timezone`,
      `X-Locale` on every authenticated request. Log on `user_sessions` +
      `login_attempts`.
- [ ] 76. **G8** — `user_sessions` migration + `LoginAttempt` recorder wired to
      token issue/revoke.
- [ ] 77. `terminology` auto-seed: hook `BusinessType::defaultTerminology()`
      into the tenant-created listener.
- [ ] 78. Feature tests for the new middleware + session recorder.

## Wave 11 — Backend Organization module

Blocks Phase 8 on the frontend. Multi-day work; each task lists its own gates.

- [ ] 79. **G6.1** — Scaffold `modules/Organization` (composer.json,
      module.json, providers) + wire into `bootstrap/providers.php`.
- [ ] 80. **G6.2** — `Organization` model + migration + factory + seeder +
      `OrganizationPolicy`. Slug + UUID + tenant scope.
- [ ] 81. **G6.3** — `Branch` model + migration + FK to Organization + policy +
      factory + seeder.
- [ ] 82. **G6.4** — `Team` model + migration + FK to Branch + Sport + Season +
      policy + factory + seeder.
- [ ] 83. **G6.5** — `Season` model + migration + tenant scope + policy +
      factory + seeder.
- [ ] 84. **G6.6** — REST controllers + routes
      (`GET|POST|PATCH|DELETE     /api/v1/{organizations,branches,teams,seasons}[/{id}]`)
      each returning Foundation-enveloped `{data, meta}`.
- [ ] 85. **G6.7** — Feature tests: CRUD per resource, tenant isolation, policy
      checks, cascade rules.
- [ ] 86. **G6.8** — Extend `MeController` to populate `scopes.*` from these
      tables (currently returns empty arrays per handoff §5.1).
- [ ] 87. **G6.9** — Backend Pint/PHPStan/phpunit green + commit + push + PR +
      merge.

## Wave 12 — Frontend Phase 5 + 8 (once backend lands)

Once Waves 9–11 ship, the frontend flips are one-line changes per resource plus
a few small refactors.

- [ ] 88. **Phase 5** — remove fixture roles/permissions/features fallbacks;
      `accessControlProvider` drives everything from `/me`.
      `synthesizeIdentityFromMinimalUser` can shrink to platform-only.
- [ ] 89. **Phase 5** — flip `features` from mock to `default` provider in
      `BACKEND_READY_RESOURCES` and delete `public/data/features.json` (once G10
      lands).
- [ ] 90. **Phase 8** — flip `organizations`, `branches`, `teams`, `seasons`
      from mock to `default` in their manifests; delete fixtures.
      `scope-context.tsx` fetches from real endpoints instead of `me.json`.
- [ ] 91. Add tests exercising the real REST flow via MSW handlers per resource.

## Wave 13 — Phase 9 domain migrations

One PR per module. Each is: (a) add resource name to `BACKEND_READY_RESOURCES`,
(b) delete `dataProviderName: "mock"` on the resource meta, (c) delete the
fixture, (d) smoke test.

Suggested order (by domain dependency):

- [ ] 92. `athletes`, `athlete-enrollments`, `guardians`, `documents`
- [ ] 93. `team-members`, `registrations`
- [ ] 94. `sports`, `tenant-sports`, `attribute-sets`
- [ ] 95. `events`, `event-invitations`
- [ ] 96. `matches`, `trainings`, `sessions`
- [ ] 97. `attendance`
- [ ] 98. `progress`, `performance`
- [ ] 99. `medical`, `safeguarding`
- [ ] 100. `invoices`, `payments`, `memberships`, `expenses`
- [ ] 101. `staff`, `users`, `roles`, `permissions`, `credentials`
- [ ] 102. `announcements`, `messaging`, `notifications`
- [ ] 103. `leads`, `passes`, `awards`, `integrations`
- [ ] 104. `drills`, `development`, `competition`, `formations`
- [ ] 105. `public-site`

## Wave 14 — E2E + ops

- [ ] 106. Playwright REST-mode job: spins up Docker backend, runs auth +
      billing + entitlements flows against real endpoints.
- [ ] 107. Real-backend smoke test doc in `README.md` + `docker-compose up -d`
      quickstart on the frontend side.
- [ ] 108. Vercel: tenant subdomain routing (`*.academorix.app`) + confirm
      wildcard TLS.
- [ ] 109. Doppler production wiring for `apps/web/environments/.env.production`
      (Reverb host, app key, API URL).
- [ ] 110. Vercel preview-deploy Playwright run (per-PR).

## Wave 15 — Optional / P2

- [ ] 111. **Vercel-style pricing Phase B** (backend): add
      `PlanTier.highlights: string[]`, `PlanTier.cta: {label, type}`,
      `PlanGrant.category: string`, `PlanGrant.description: string | null` to
      the catalog DTOs.
- [ ] 112. **Phase C** — `GET /api/billing/addons` endpoint + Add-ons section on
      `/pricing`.
- [ ] 113. **G9** — Enable tenant 2FA: add `TwoFactorAuthenticatable` trait to
      `User`, migration for the 3 encrypted columns, remove `501` stubs.
- [ ] 114. **G13** — Password-policy config exposed on
      `GET /api/v1/config/password-policy` (min length, complexity rules).
- [ ] 115. Custom-domain flow (backend `Domain` row + DNS validation UI).
- [ ] 116. Central admin subdomain decision + wiring (`admin.academorix.app` vs
      `academorix.app/admin`).
- [ ] 117. Impersonation E2E test against real backend (platform → tenant).
- [ ] 118. AI Assistant real integration (stubbed today).
- [ ] 119. Reports module real dashboards (stubbed today).
- [ ] 120. `offline-sync` module real service-worker + queue.
- [ ] 121. `public-site` live rendering pipeline.

## Cross-cutting standards (every wave)

- Docblocks on every file, exported type, hook, provider, and non-trivial
  helper. Inline comments for anything non-obvious.
- PHP: PSR-12, `declare(strict_types=1)`, Pint clean, PHPStan L6.
- TS: strict, ESLint clean, Prettier formatted.
- Tests: PHPUnit for backend, Vitest for frontend, Playwright for E2E.
- Gates green before commit: `tsc`, `lint`, `knip`, `test`, `build`, `size`.
- Conventional commits with body lines ≤100 chars (multiple `-m`).
- Never `git add -A`; always stage specific paths.
