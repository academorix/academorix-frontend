# Backend → Frontend Handoff

_Status of the Laravel API relative to `PLAN.md` and `API_CONTRACT.md`._
_Snapshot date: 2026-07-02_

## 1. How to use this doc

Read in this order:

1. **`PLAN.md`** — the original alignment plan (endpoint matrix, gaps G0-G13,
   frontend refactor phases).
2. **`API_CONTRACT.md`** — the endorsed contract with every payload shape.
3. **This doc** — the delta between those two and today's on-disk backend.

Anything below that contradicts `PLAN.md` / `API_CONTRACT.md` is authoritative
for the current backend state; anything below that agrees with them is
confirmation the contract is honoured.

## 2. What shipped since `PLAN.md` was written

Sixteen commits landed the full **platform-subscription-entitlements** spec plus
the identity bootstrap. The relevant commit chain (all on `origin/main`):

```
ed0ef42 refactor(auth): contract-first authentication service boundaries
a5ec29d feat(billing): scaffold Subscription + Entitlements modules and install billing packages
22231cf refactor(billing): relocate vendor migrations to owning modules + wrap-not-duplicate the entitlements schema
d7774f2 feat(subscription): plan catalog service + seeder + tests (Task 2)
f69856a feat(subscription): billing gateway seam (BillingGatewayInterface + Fake + Paddle) [Task 3]
8342eae feat(subscription): lifecycle service + tenant_subscriptions mirror [Task 4]
cb4cc65 feat(subscription): billing controllers + SubscriptionPolicy [Task 5]
251115a feat(subscription): Cashier webhook -> local mirror sync [Task 6]
62f5227 feat(entitlements): provisioner + gate + wiring [Tasks 7-8-9]
7583c60 feat(billing): reconciliation + feature-flag composition + usage surface + grace-lapse [Tasks 10-11-13-15]
```

Two new modules exist on disk and are wired into `bootstrap/providers.php`:

- `modules/Subscription/**` — Cashier/Paddle billing lifecycle (checkout,
  portal, pause/resume/cancel, plan-change, webhook mirror).
- `modules/Entitlements/**` — quota + feature gate on top of
  `masterix21/laravel-entitlements`.

Plus an extension of the existing `FeatureFlag` module with a composition
resolver (overrides + rollout + kill-switches).

## 3. What's on disk **but not yet committed** (as of this handoff)

Run `git status` in `backend/` to see the current uncommitted set. Right now:

**Modified (staged for the /me bootstrap work):**

- `boost.json`
- `config/cors.php` — added `allowed_origins_patterns`, `exposed_headers`
  (`X-Api-Version`, `Retry-After`, `Deprecation`, `Sunset`), env-driven
  `max_age`.
- `docker-compose.yml` — renamed `valkey` → `redis` service (image still
  `valkey/valkey:8-alpine` for Cloud parity).
- `modules/Auth/database/seeders/AuthPermissionSeeder.php`
- `modules/Auth/routes/tenant.php` — added `GET /api/auth/me`.
- `modules/Auth/routes/platform.php` — added `GET /api/v1/platform/auth/me`.

**Renamed:**

- `modules/Tenancy/database/migrations/2020_05_15_000010_create_tenant_user_impersonation_tokens_table.php`
  → `2026_07_02_100005_...` (FK to `tenants(id)` was running before the table
  existed on fresh DBs).

**New (untracked):**

- `modules/Auth/src/Controllers/Tenant/MeController.php`
- `modules/Auth/src/Controllers/Platform/MeController.php`
- `modules/Auth/src/Data/MeData.php`
- `modules/Auth/src/Data/PlatformMeData.php`
- `modules/Auth/src/Data/UserProfileData.php`
- `modules/Auth/src/Data/TenantSummaryData.php`
- `modules/Auth/src/Data/AllowedScopesData.php`
- `modules/Auth/src/Data/QuotaHeadlineData.php`
- `modules/FeatureFlag/src/Controllers/TenantFeaturesController.php` — **created
  but NOT routed yet** (see §7 open item G10).

Nothing here has been PHPStan-checked, Pint-formatted, tested, or committed. The
frontend agent should treat these as an in-flight preview — the shapes are
stable, the URL surface is settled, but PR polish is pending.

## 4. Live route surface (source of truth)

Emitted by `php artisan route:list --except-vendor`. Grouped by concern:

### Tenant-scoped API (served on `{slug}.stackra.app`, prefix `/api`)

| Method   | URI                                                      | Auth                                     | Purpose                                                  |
| -------- | -------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| GET      | `api/current-tenant`                                     | public                                   | Host-resolved TenantData                                 |
| GET      | `api/ping`                                               | public                                   | Foundation health                                        |
| POST     | `api/auth/login`                                         | throttle:login                           | login flow                                               |
| POST     | `api/auth/logout`                                        | sanctum + tenant.user                    | logout                                                   |
| POST     | `api/auth/refresh`                                       | sanctum + tenant.user                    | rotate token                                             |
| POST     | `api/auth/register`                                      | throttle:6,1                             | register                                                 |
| **GET**  | **`api/auth/me`**                                        | **sanctum + tenant.user**                | **identity bootstrap (NEW)**                             |
| GET      | `api/auth/email/verify`                                  | sanctum + tenant.user                    | notice                                                   |
| GET      | `api/auth/email/verify/{id}/{hash}`                      | signed + throttle                        | consume                                                  |
| POST     | `api/auth/email/verification-notification`               | sanctum + tenant.user + throttle         | resend                                                   |
| POST     | `api/auth/forgot-password`                               | throttle:6,1                             | password reset request                                   |
| POST     | `api/auth/reset-password`                                | throttle:6,1                             | reset                                                    |
| POST     | `api/auth/confirm-password`                              | sanctum + tenant.user                    | step-up                                                  |
| POST     | `api/auth/change-password`                               | sanctum + tenant.user                    | rotate                                                   |
| POST     | `api/auth/two-factor/{enable,confirm,disable,challenge}` | mixed                                    | **live** — tenant 2FA is fully implemented (F6 complete) |
| GET/POST | `api/auth/two-factor/recovery-codes`                     | sanctum + tenant.user + password.confirm | tenant 2FA recovery codes                                |
| GET      | `api/billing/catalog`                                    | public                                   | **public pricing page (NEW)**                            |
| GET      | `api/billing/status`                                     | sanctum + tenant                         | current subscription                                     |
| POST     | `api/billing/checkout`                                   | sanctum + tenant + manage_billing        | start checkout                                           |
| POST     | `api/billing/change-plan`                                | sanctum + tenant + manage_billing        | upgrade/downgrade                                        |
| POST     | `api/billing/pause`                                      | sanctum + tenant + manage_billing        | pause                                                    |
| POST     | `api/billing/resume`                                     | sanctum + tenant + manage_billing        | resume                                                   |
| POST     | `api/billing/cancel`                                     | sanctum + tenant + manage_billing        | cancel                                                   |
| GET      | `api/billing/portal`                                     | sanctum + tenant + manage_billing        | provider portal URL                                      |
| GET      | `api/billing/invoices`                                   | sanctum + tenant                         | list invoices                                            |
| GET      | `api/entitlements/usage`                                 | sanctum + tenant                         | full quota matrix                                        |

### Platform surface (served on central domain)

| Method   | URI                                              | Auth                                                              | Purpose                      |
| -------- | ------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------- |
| POST     | `api/v1/platform/auth/login`                     | platform.domain + throttle                                        | login                        |
| POST     | `api/v1/platform/auth/logout`                    | + sanctum + platform.user                                         | logout                       |
| POST     | `api/v1/platform/auth/refresh`                   | + sanctum + platform.user                                         | rotate                       |
| **GET**  | **`api/v1/platform/auth/me`**                    | **+ sanctum + platform.user**                                     | **identity bootstrap (NEW)** |
| POST     | `api/v1/platform/auth/forgot-password`           | throttle:6,1                                                      | forgot                       |
| POST     | `api/v1/platform/auth/reset-password`            | throttle:6,1                                                      | reset                        |
| POST     | `api/v1/platform/auth/confirm-password`          | + sanctum + platform.user                                         | step-up                      |
| POST     | `api/v1/platform/auth/change-password`           | + sanctum + platform.user + ensure_2fa_enabled                    | rotate                       |
| POST     | `api/v1/platform/auth/two-factor/enable`         | + sanctum + platform.user                                         | enrol                        |
| POST     | `api/v1/platform/auth/two-factor/confirm`        | + sanctum + platform.user                                         | confirm                      |
| POST     | `api/v1/platform/auth/two-factor/challenge`      | throttle:two-factor                                               | challenge                    |
| GET/POST | `api/v1/platform/auth/two-factor/recovery-codes` | + sanctum + platform.user + ensure_2fa_enabled + password.confirm | codes                        |
| POST     | `api/v1/platform/auth/two-factor/disable`        | + sanctum + platform.user                                         | **always 403**               |
| POST     | `api/v1/platform/auth/impersonate`               | 6-layer stack (see routes/platform.php)                           | start                        |
| POST     | `api/v1/platform/auth/impersonate/stop`          | tenant-side token                                                 | stop                         |

### Platform admin — tenant management (central, `/api/v1`)

Requires `auth:sanctum` + `can:manage-tenants` + `api.version`.

- `GET|POST /api/v1/tenants`
- `GET|PUT|DELETE /api/v1/tenants/{tenant}`
- `POST /api/v1/tenants/{tenant}/{activate,suspend,deactivate,cancel-deletion}`
- `GET /api/v1/tenants/{tenant}/features`
- `PUT /api/v1/tenants/{tenant}/features/{feature}`

## 5. New endpoint contracts (JSON shape)

All responses from Auth + Subscription + Entitlements controllers use the
Foundation `{message, status, data, meta?}` envelope. The **login** endpoint is
still the one exception (returns `AuthTokenData` flat).

### 5.1 `GET /api/auth/me` — tenant identity bootstrap

Response shape (payload of `data`):

```json
{
  "user": {
    "id": "018e7c8b-...",
    "name": "Ada Lovelace",
    "email": "ada@example.test",
    "email_verified_at": "2026-07-01T09:12:33+00:00",
    "status": "Active",
    "last_login_at": "2026-07-02T10:03:11+00:00"
  },
  "profile": {
    "first_name": "Ada",
    "last_name": "Lovelace",
    "display_name": "Ada Lovelace",
    "avatar_url": null,
    "locale": "en",
    "timezone": "UTC"
  },
  "roles": ["owner", "coach"],
  "permissions": ["manage_users", "manage_billing", "view_athletes"],
  "features": ["athletes", "teams", "scheduling", "attendance"],
  "terminology": { "athletes": "Students", "teams": "Classes" },
  "tenant": {
    "id": "018e7c8b-...",
    "slug": "sunset-academy",
    "name": "Sunset Academy",
    "business_type": "academy",
    "status": "active",
    "status_label": "Active",
    "branding": {
      "logo_url": "https://.../logo.png",
      "favicon_url": null,
      "primary_color": "#00A3FF",
      "secondary_color": null,
      "accent_color": null,
      "email_from_name": "Sunset Academy",
      "email_from_address": "hello@sunset.example",
      "email_reply_to": null,
      "custom_css": null
    }
  },
  "tenants": [
    {
      "id": "018e7c8b-...",
      "slug": "sunset-academy",
      "name": "Sunset Academy",
      "business_type": "academy",
      "status": "active",
      "status_label": "Active",
      "branding": null
    },
    {
      "id": "018f1a2c-...",
      "slug": "iron-fitness",
      "name": "Iron Fitness",
      "business_type": "gym",
      "status": "trialing",
      "status_label": "Trialing",
      "branding": null
    }
  ],
  "scopes": {
    "organizations": [],
    "branches": [],
    "seasons": []
  },
  "subscription": {
    "id": 1,
    "plan_key": "growth",
    "plan_id": 3,
    "plan_version": 1,
    "status": "active",
    "billing_period": "monthly",
    "currency": "USD",
    "trial_ends_at": null,
    "current_period_ends_at": "2026-08-02T00:00:00+00:00",
    "grace_ends_at": null,
    "canceled_at": null,
    "entitlements_active": true
  },
  "quota_summary": [
    { "key": "athlete_slot", "used": 47, "limit": 100 },
    { "key": "branch_slot", "used": 2, "limit": 5 },
    { "key": "team_slot", "used": 6, "limit": 20 }
  ]
}
```

Field contracts worth calling out:

- **`user.status`** — the human label from the `UserState` machine (`Active` /
  `Pending` / `Disabled`). The frontend `AuthUser.status` type should widen to
  `string` (or a labelled union).
- **`profile.first_name` / `.last_name`** — **derived from `user.name` by
  splitting on the first space**. Backend does not have real first/last columns
  yet. Single-word names return `last_name: ""`.
- **`profile.avatar_url` / `.phone` / `.phone_verified_at`** — always `null`
  until the profiles satellite table lands. Do **not** treat missing as a bug.
- **`permissions`** — the array `["*"]` is the superuser sentinel (only emitted
  by the platform variant when `super_admin` role is held; tenant side always
  returns the real enumerated permissions).
- **`terminology`** — currently reads from the `terminology` key on
  `tenant_settings` if present; empty object otherwise. Tenancy module bootstrap
  does not yet auto-seed this from `BusinessType::defaultTerminology()` (open
  item, see §7).
- **`tenants[]`** — cross-tenant list is filtered by matching `user.email`
  across every tenant. A person invited to multiple academies will see them all
  here. Branding is stripped from the cross-tenant list to keep the payload
  small (fetch on switch).
- **`scopes.*`** — **all three arrays are always empty** today.
  Organization/Branch/Season modules are not built. Frontend must render the
  switcher tolerant of empty state.
- **`subscription`** — **can be `null`** when the tenant hasn't checked out yet.
  Render the "choose a plan" onboarding on that state.
- **`quota_summary`** — cap 3-5 rows, only rows with a finite limit (unlimited
  grants are skipped so the shell doesn't render an empty meter). Full matrix is
  on `/api/entitlements/usage`.

Envelope:

```json
{
  "message": "Identity retrieved.",
  "status": 200,
  "data": { ... payload above ... }
}
```

### 5.2 `GET /api/v1/platform/auth/me` — platform identity bootstrap

Same envelope, different body:

```json
{
  "user": {
    "id": 12,
    "name": "Grace Hopper",
    "email": "grace@stackra.app",
    "two_factor_enabled": true,
    "last_login_at": "2026-07-02T09:47:11+00:00"
  },
  "profile": {
    "first_name": "Grace",
    "last_name": "Hopper",
    "display_name": "Grace Hopper",
    "avatar_url": null,
    "locale": "en",
    "timezone": "UTC"
  },
  "roles": ["super_admin"],
  "permissions": ["*"],
  "is_platform_admin": true,
  "two_factor_confirmed_at": "2026-06-20T14:32:04+00:00"
}
```

Notes:

- `user.id` is **integer** (not UUID) — platform users live in the central DB
  with a big auto-increment PK. Update the frontend `PlatformUser.id` type
  accordingly.
- `is_platform_admin: true` is the stable discriminator the SPA router uses to
  send the caller to `/platform/admin` instead of the tenant shell.
- Super-admin gets `permissions: ["*"]` because `Gate::before` grants every
  ability without needing enumerated permission rows.
- No `tenant`, `scopes`, `subscription`, `quota_summary` — those are tenant
  concepts.

### 5.3 `GET /api/billing/catalog` — public pricing page

Returns the seeded 4 tiers × 2 billing periods (Starter / Growth / Pro /
Enterprise), each with an SKU per billing period + a grants matrix + prices.
Shape is `PlanTierData[]` — see
`modules/Subscription/src/Data/PlanTierData.php`. Publicly reachable; no auth
required.

### 5.4 `GET /api/billing/status` — tenant subscription

Returns the same `SubscriptionSummaryData` embedded in `/me` but as a standalone
endpoint (useful for polling after a checkout redirect completes).

### 5.5 `GET /api/entitlements/usage` — full quota matrix

Returns every entitlement type with `{key, used, limit, is_unlimited}` — the
full picture behind `/me.quota_summary`. Renders the full "Plan usage" table in
the billing settings screen.

## 6. Frontend type additions needed

Given the shipping shapes above, the frontend needs new / updated types.
Locations are the current mock-driven files under
`frontend/apps/web/src/types/`.

| Frontend type         | Change                                                                                                 | Backend source            |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------- |
| `Identity`            | Extend to include `subscription: SubscriptionSummary \| null` and `quota_summary: QuotaHeadline[]`     | `MeData`                  |
| `AuthUser`            | `id: string`; `phone`, `phone_verified_at` accept `null`; `first_name`/`last_name` accept empty string | `UserData`                |
| `UserProfile`         | (new or align) fields as in §5.1                                                                       | `UserProfileData`         |
| `TenantSummary`       | Ensure `business_type` is nullable, add `status_label`, `branding` may be `null`                       | `TenantSummaryData`       |
| `AllowedScopes`       | Ensure the three lists tolerate empty arrays                                                           | `AllowedScopesData`       |
| `SubscriptionSummary` | **new** — see §5.1 shape                                                                               | `SubscriptionSummaryData` |
| `QuotaHeadline`       | **new** — `{key, used, limit \| null}`                                                                 | `QuotaHeadlineData`       |
| `PlatformIdentity`    | **new** — see §5.2, `id: number`, `is_platform_admin: true`, `two_factor_confirmed_at: string \| null` | `PlatformMeData`          |

## 7. Open backend items still blocking full alignment

Priority-ordered from the FE-integration point of view:

1. **G10 — `GET /api/v1/features` (tenant-side)**: `TenantFeaturesController` is
   coded but **not registered** in any route file. The FE's "Features & billing"
   settings page still has no server for the resolved-features list. Fix: append
   a `Route::middleware(['auth:sanctum', 'tenant'])` group with
   `Route::get('v1/features', TenantFeaturesController::class)` to
   `modules/FeatureFlag/routes/api.php`.
2. **G2 — permissions seeder**: `manage_billing` + `view_billing` permission
   rows are NOT yet seeded under the `sanctum` guard. The billing controllers'
   policy checks will 403 every caller until this lands. Backend to update
   `modules/Auth/database/seeders/AuthPermissionSeeder.php`.
3. **Migration renumber + /me DTOs + CORS + routes** not committed yet — the FE
   agent will see these locally but the changes aren't on `origin/main`. Backend
   to run Pint + PHPStan L6 + full-suite green, then commit.
4. **No feature tests for `/me`** — should have (a) 200 + shape assertion, (b)
   401 unauth, (c) platform variant returns `is_platform_admin: true`. Adds
   regression protection for the FE contract.
5. **`terminology` not auto-seeded** on tenant creation. Today the payload's
   `terminology` field is `{}` for a fresh tenant unless someone manually
   inserts a row into `tenant_settings`. Backend to hook
   `BusinessType::defaultTerminology()` into the tenant-created listener.
6. **G9 — tenant 2FA fully live**. `User` model carries Fortify's
   `TwoFactorAuthenticatable` trait. All five endpoints (enable / confirm /
   disable / challenge / recovery-codes) work end-to-end. Tenant login detects
   `two_factor_confirmed_at` and returns `TwoFactorRequiredData` when the caller
   has enrolled. Challenge endpoint mirrors the platform surface — accepts a
   valid TOTP or recovery code, redeems, mints access token.
7. **Scopes are empty** — `organizations` / `branches` / `seasons` all `[]`
   until the Organization module lands. Frontend must render the workspace
   switcher gracefully with no scopes.

## 8. Environment / local setup

Docker stack (`backend/docker-compose.yml`), compose project name `stackra`:

| Container              | Image                    | Host port   | Purpose                                         |
| ---------------------- | ------------------------ | ----------- | ----------------------------------------------- |
| `stackra_app`       | `stackra-dev:local`   | 8000        | PHP 8.4 + artisan serve (`--no-reload`)         |
| `stackra_queue`     | `stackra-dev:local`   | —           | `queue:work`                                    |
| `stackra_scheduler` | `stackra-dev:local`   | —           | `schedule:work`                                 |
| `stackra_reverb`    | `stackra-dev:local`   | 8080        | WebSockets                                      |
| `stackra_postgres`  | `postgres:18-alpine`     | 5432        | database                                        |
| `stackra_redis`     | `valkey/valkey:8-alpine` | 6379        | cache + queue + session (renamed from `valkey`) |
| `stackra_minio`     | `minio/minio:latest`     | 9000 / 9001 | S3-compatible object store                      |
| `stackra_pgadmin`   | `dpage/pgadmin4:latest`  | 5150        | DB browser (`admin@example.com` / `admin`)      |

Bring the stack up:

```
cd backend
docker compose up -d --build
docker exec stackra_app php artisan migrate --force
```

Frontend origin should be added to backend `.env`:

```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://stackra.vercel.app
CORS_ALLOWED_ORIGINS_PATTERNS=^https://[a-z0-9-]+\.stackra\.app$
```

CORS exposed headers now include `X-Api-Version`, `Retry-After`, `Deprecation`,
`Sunset` — the FE version-negotiation middleware can read these on cross-origin
responses.

## 9. Frontend action queue (suggested)

Roughly in the order that unblocks the most product surface for the least
effort:

1. **Wire `/api/auth/me` in the AuthProvider bootstrap.**
   - After `POST /auth/login` succeeds, call `GET /auth/me` on the returned
     bearer token.
   - Cache the manifest in memory + a short-TTL localStorage for hard-reload
     restore.
   - Invalidate on: logout, tenant switch, subscription events (later),
     terminology change.
2. **Add TypeScript types listed in §6.** Take the JSON in §5.1 / §5.2 as the
   source of truth.
3. **Handle `subscription: null` gracefully.** Show a "Choose a plan" onboarding
   when there is no subscription; render the plan badge + countdown when it's
   set.
4. **Render `quota_summary` as headline meters** (3-5 rows) on dashboards and
   near "Add athlete/team/branch" affordances.
5. **Wire the pricing page against `GET /api/billing/catalog`** — public, no
   auth required.
6. **Wire billing settings** against `/api/billing/status`,
   `/api/billing/portal`, `/api/billing/invoices`, `/api/billing/change-plan`,
   `/api/billing/{pause,resume,cancel}`.
7. **Wire the entitlements matrix screen** against `/api/entitlements/usage`.
8. **Cross-tenant workspace switcher** consumes `me.tenants[]`. When the caller
   picks a tenant, redirect to `https://{slug}.stackra.app` with a
   re-authentication step (each subdomain gets its own bearer token — do not
   reuse tokens across tenants).
9. **`/features` page** — wait for backend G10 to land, then wire against
   `GET /api/v1/features` (shape: `[{feature, label, enabled, source}]`).
10. **Platform admin `/me`** — same pattern but routes to `/platform/admin/*`
    and does not render tenant chrome.

## 10. Contact points for follow-ups

- Backend API contract questions: reference
  `frontend/.kiro/specs/backend-frontend-alignment/API_CONTRACT.md` first.
- Endpoint URL / method / auth stack: check
  `docker exec stackra_app php artisan route:list --except-vendor` (source of
  truth).
- DTO field-by-field shape: read the `*Data.php` file the endpoint returns —
  every property has a docblock line.
- Subscription state machine + entitlement grant logic:
  `backend/.kiro/specs/platform-subscription-entitlements/design.md` (16-task
  spec, all delivered).

## 11. Reconciliations applied to the shared spec

To keep the endorsed `API_CONTRACT.md` + `PLAN.md` +
`frontend-module-architecture.md` steering aligned with what actually shipped,
these one-line URL corrections were made in-place:

- `GET /api/v1/auth/me` → `GET /api/auth/me` (tenant surface has no `v1` prefix;
  that's reserved for the platform surface). Platform variant remains
  `/api/v1/platform/auth/me`.
- `PLAN.md` §0.a matrix row for `/me` flipped from ❌ Missing to ✅ Ready with a
  pointer to §5.1 of this handoff.

If the FE agent had drafted these paths with intent for `/v1/`, that's the one
contract deviation worth re-discussing. Otherwise consider it settled.
