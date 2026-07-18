# Auth system — task tracker

Slack-style multi-tenant auth for the Academorix dashboard, built on the
already-shipped Laravel Sanctum backend. Every auth endpoint in
`backend/modules/Auth/routes/*.php` + `backend/modules/Tenancy/routes/*.php` is
now wired to a real frontend surface. This spec closes out with Phase 3 shipped.

## Phase 1 — foundation (shipped)

Login flow, tenant subdomain routing, workspace preview endpoint, Sanctum bearer
token storage. See git history + earlier revisions of this file for detail.

## Phase 2 — advanced auth (shipped)

WebAuthn passkey sign-in, SMS OTP, password-confirm gate, sessions management,
MFA method enrolment (TOTP + SMS + Passkey), change-password, email verification
landing, invite acceptance.

## Phase 3 — dashboard integration (shipped THIS ITERATION)

### Backend

- [x] `spatie/laravel-activitylog` verified present (was already in
      `composer.json`).
- [x] `Activity` module — thin read-only surface over the vendor's Activity
      model.
  - `Data\ActivityEntryData` — snake-case DTO with defensive causer / subject /
    icon resolution.
  - `Controllers\ActivityController` — `GET /api/v1/activities` with
    `filter[log_name|event|causer_id|subject]` + `per_page`.
  - `Providers\ActivityServiceProvider` — mounts the tenant-scoped routes under
    `[api, tenant, auth:sanctum]`.
  - `composer.json` + `module.json` + `README.md`.
- [x] `Tenancy\Services\TenantOnboardingService` — derives step completion from
      real workspace state (branches, staff, sessions, payment providers,
      safeguarding officers). 60s per-tenant cache with
      `flushForTenant($tenantId)` invalidation.
- [x] `Tenancy\Data\OnboardingStepData` + `OnboardingData` — wire DTOs.
- [x] `Tenancy\Controllers\Tenant\OnboardingController` —
      `GET /api/auth/me/onboarding` returning the aggregate.
- [x] Route registered in `Auth/routes/tenant.php` behind `auth:sanctum` +
      `tenant.user`.

### Frontend hooks

- [x] `hooks/use-onboarding.ts` — fetches the aggregate, falls back to the local
      fixture when unauthenticated in dev.
- [x] `hooks/use-recent-activity.ts` — fetches `GET /api/v1/activities`, fixture
      fallback in dev.
- [x] `hooks/use-my-workspaces.ts` — module-level cached
      `GET /api/v1/me/workspaces` reader.

### Frontend UI

- [x] `components/dashboard/onboarding-checklist.tsx` — refactored to consume
      `useOnboarding`. Loading / error / empty states handled.
- [x] `components/dashboard/recent-activity.tsx` — refactored to consume
      `useRecentActivity`. Relative-time formatter, chip colour derived from
      event tag, safe fallback icon.
- [x] `components/email-verification-banner.tsx` — nag banner rendered inside
      `AppShell`. Probes `GET /api/auth/email/verify` on mount, dismissible per
      session, resend flow with toast.
- [x] `components/workspace-switcher.tsx` — dropdown listing every caller-owned
      workspace. Sorts by current → last-active → alphabetical. Staff-only
      memberships hidden by default. Cross-origin navigation to the target
      tenant subdomain.
- [x] Sidebar footer — new `WorkspaceSwitcherRow` inline row above the user
      pill. Auto-hides in icon-only mode + when the caller has only one
      workspace.
- [x] `modules/settings/pages/security/recovery-codes-panel.tsx` — view / copy /
      download / rotate. Rotate is password-confirm- gated. Codes stay hidden
      until the caller clicks "Show codes".
- [x] `modules/settings/pages/security/security-page.tsx` — fourth tab "Recovery
      codes" added with `?tab=recovery` deep-link.

### API surface

- [x] `authApi.onboarding()` — `GET /api/auth/me/onboarding`.
- [x] `authApi.recentActivity(perPage)` — `GET /api/v1/activities`.
- [x] `authApi.myWorkspaces()` — `GET /api/v1/me/workspaces`.
- [x] All Phase 2 methods (change password, sessions, MFA methods, recovery
      codes, phone OTP, WebAuthn, email verification).

## Deferred to a follow-up

- [ ] **Phone verification UI in Settings > Profile** — backend endpoints
      (`POST /api/auth/phone/verify/request` + `/confirm`) exist; the UI is
      small but needs a Profile page.
- [ ] **SSO / SAML / OIDC federation** — separate spec
      (`.kiro/specs/sso-federation/`). Multi-week feature — needs backend IdP
      model + ACS callbacks + JIT provisioning.
- [ ] **Every domain module** (Athletes, Sessions, Payments, Safeguarding, …)
      writing to `activity()->log('…')` at each write site. This is a per-module
      task, not a single ship.
- [ ] Onboarding cache invalidation observers — attach
      `TenantOnboardingService::flushForTenant()` to each writer module's
      `Created` observer so completions write through without waiting for the
      60s TTL.

## Verification

- [x] `pnpm exec tsc -p tsconfig.app.json --noEmit` — exit 0.
- [x] `pnpm build` — exit 0 (23.48s).
- [ ] Backend: `php artisan test --filter=Onboarding` — pending full local DB
      setup.
- [ ] Manual: fresh workspace shows all six onboarding steps incomplete; adding
      a branch flips "branch" to complete within 60s.
- [ ] Manual: dashboard "Recent activity" widget reflects a real
      `activity()->log(...)` write within one refresh.
- [ ] Manual: workspace-switcher row appears in the sidebar footer when the
      caller has ≥ 2 workspaces.
- [ ] Manual: email verification banner appears on `/dashboard` when the
      caller's email is unverified; disappears when verified.
- [ ] Manual: `/settings/security?tab=recovery` deep-links into the
      recovery-codes tab and "Show codes" reveals the set.

## Phase 4 — closeout (shipped THIS ITERATION)

### Backend

- [x] `Foundation\Concerns\HasSemanticActivity` trait — opinionated wrapper over
      `spatie/laravel-activitylog`'s `LogsActivity` that auto-populates
      `properties.icon`, `properties.subject_label`, and
      `properties.causer_name`. Domain models opt in with a single
      `use HasSemanticActivity` line.
- [x] `Foundation\Concerns\InvalidatesOnboardingCache` trait — hooks the
      `created` + `deleted` model events to call
      `TenantOnboardingService::flushForTenant($tenantId)` so
      onboarding-relevant writes tick through to the widget without waiting for
      the 60s TTL.

### Frontend

- [x] `/settings/profile` — new page with:
  - Read-only identity card (name / email / role / avatar).
  - `PhoneVerificationPanel` — three-state (add / verify / verified) flow wired
    to `POST /api/auth/phone/verify/request` +
    `POST /api/auth/phone/verify/confirm`.
- [x] `authApi.phoneVerificationRequest` + `authApi.phoneVerificationConfirm` —
      typed endpoint wrappers.
- [x] Settings sections: `profile` entry added, routed to `/settings/profile`.
      Registered before the catch-all `/:sectionId` route in
      `settings.module.ts`.

### SSO / SAML / OIDC spec

- [x] `.kiro/specs/sso-federation/tasks.md` — a phased, execution-ready plan for
      the multi-week SSO story: Phase A (foundation) → Phase B (SAML) → Phase C
      (OIDC) → Phase D (admin UI) → Phase E (sign-in UX) → Phase F (SLO + SCIM).
      Includes final backend endpoint surface, non-goals, and open questions.

## Full closeout state

Every task from the original Phase 2 deferred list is either shipped or has an
execution-ready spec covering it:

| Original deferred item             | Status                                     |
| ---------------------------------- | ------------------------------------------ |
| WebAuthn / passkey sign-in         | Shipped (Phase 2)                          |
| SMS OTP flow                       | Shipped (Phase 2)                          |
| Password-confirm gate              | Shipped (Phase 2)                          |
| Sessions / MFA management          | Shipped (Phase 2)                          |
| Change-password page               | Shipped (Phase 2)                          |
| Email verification landing         | Shipped (Phase 2)                          |
| Invite acceptance (`/join/:token`) | Shipped (Phase 2)                          |
| Verify-email nag banner            | Shipped (Phase 3)                          |
| Workspace switcher                 | Shipped (Phase 3)                          |
| Recovery codes UI                  | Shipped (Phase 3)                          |
| Phone verification UI              | **Shipped (Phase 4)**                      |
| Onboarding cache invalidation      | **Shipped (Phase 4)** (trait)              |
| Semantic activity logging          | **Shipped (Phase 4)** (trait)              |
| SSO / SAML / OIDC                  | **Spec ready** (`sso-federation/tasks.md`) |

## Verification (Phase 4)

- [x] `pnpm exec tsc -p tsconfig.app.json --noEmit` — exit 0.
- [x] `pnpm build` — exit 0 (~8s).
- [ ] Backend: PHP unit tests for `HasSemanticActivity` +
      `InvalidatesOnboardingCache` — write next.
- [ ] Manual: `/settings/profile` renders, phone add + verify cycle works
      against a real backend.

## What's genuinely left

- **Per-model adoption of `HasSemanticActivity`** — instrument each domain
  module (Athletes, TrainingSessions, Payments, Safeguarding Cases,
  Registrations, Coaches, …) by adding `use HasSemanticActivity` on the model.
  Each is a 1-line change; the trait handles the rest. Left to the domain-module
  owners to land as they promote their fixtures to DB-backed.
- **Per-model adoption of `InvalidatesOnboardingCache`** — same story, one-line
  opt-in on each onboarding-relevant model (Branch, Staff, TrainingSession,
  PaymentProvider, SafeguardingOfficer).
- **SSO implementation** — see `.kiro/specs/sso-federation/tasks.md`. Estimated
  10-12 dev-days.
