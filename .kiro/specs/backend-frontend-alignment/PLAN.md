# Stackra — Backend ↔ Frontend Alignment Plan

Comprehensive plan to align the mock-driven frontend with the actual Laravel
backend, based on a deep scan of both codebases performed on 2026‑07‑04.

**Scope covered**

- Tenancy model (subdomain identification, workspace picker, custom domains)
- Identity + auth flows (tenant vs platform surfaces, 2FA, impersonation,
  password reset, register, email verification)
- Axios/HTTP client conventions (envelope, versioning, headers, CORS)
- Frontend refactor (auth provider, scope layer, data provider, resource map)
- Auth pages and flows to build (Slack‑style workspace + all auth screens)
- Demo JSON alignment (map every fixture to the real DTO)
- Backend gaps the frontend needs closed to fully wire up (documented for the
  backend team to implement)

---

## 0.a Endpoint readiness matrix (verified 2026‑07‑04)

| Surface                        | Endpoint                                                                                     | Status                             | Note                                                                                                                                                                                                                                                |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant**                     | `GET /api/current-tenant`                                                                    | ✅ Ready                           | Public, host‑resolved; returns `TenantData`.                                                                                                                                                                                                        |
| **Tenant**                     | `GET /api/v1/tenants` (list)                                                                 | ✅ Ready — **platform admin only** | `auth:sanctum + can:manage-tenants + api.version`. Not reachable from tenant SPA.                                                                                                                                                                   |
| **Tenant**                     | `POST /api/v1/tenants` (create)                                                              | ✅ Ready — platform admin only     | Self‑serve tenant creation is **gap G5**.                                                                                                                                                                                                           |
| **Tenant**                     | `GET                                                                                         | PUT                                | DELETE /api/v1/tenants/{tenant}`                                                                                                                                                                                                                    | ✅ Ready — platform admin only | Plus `/activate,/suspend,/deactivate,/cancel-deletion`. |
| **Tenant**                     | `GET /api/v1/tenants/{tenant}/features` + `PUT .../{feature}`                                | ✅ Ready — platform admin only     | Tenant‑SPA readable feature list is **gap G10**.                                                                                                                                                                                                    |
| **Auth (tenant)**              | `POST /api/auth/{login,logout,refresh,register}`                                             | ✅ Ready                           | `AuthTokenData` DTO at root (not enveloped).                                                                                                                                                                                                        |
| **Auth (tenant)**              | `POST /api/auth/{forgot,reset,confirm,change}-password`                                      | ✅ Ready                           | Broker `users`. Reset returns no token — caller must log in.                                                                                                                                                                                        |
| **Auth (tenant)**              | `GET /api/auth/email/verify`, `.../verify/{id}/{hash}`, `POST .../verification-notification` | ✅ Ready                           | Signed URLs, 6/min throttled.                                                                                                                                                                                                                       |
| **Auth (tenant)**              | `/api/auth/two-factor/*`                                                                     | 🟡 Stubbed **501**                 | `User` lacks `TwoFactorAuthenticatable` trait — gap G9.                                                                                                                                                                                             |
| **Auth (platform)**            | `POST /api/v1/platform/auth/{login,logout,refresh,forgot,reset,confirm,change}-password`     | ✅ Ready                           | Separate `platform_users` broker + `platform_password_reset_tokens` table.                                                                                                                                                                          |
| **Auth (platform)**            | `/api/v1/platform/auth/two-factor/{enable,confirm,challenge,disable,recovery-codes}`         | ✅ Ready — 2FA **mandatory**       | `disable` intentionally always 403.                                                                                                                                                                                                                 |
| **Auth (platform)**            | `POST /api/v1/platform/auth/impersonate` + `/stop`                                           | ✅ Ready                           | 6 middleware layers; `can:manage-tenants` + `password.confirm` + `ensure_2fa_enabled`.                                                                                                                                                              |
| **User**                       | `GET /api/auth/me` (bootstrap)                                                               | ✅ **Ready — new**                 | Returns identity + roles + permissions + features + terminology + tenant + tenants[] + scopes + subscription + quota_summary. Tenant `/api/auth/me`; platform `/api/v1/platform/auth/me`. Ships in the /me DTO stack — see BACKEND_HANDOFF.md §5.1. |
| **User**                       | `GET                                                                                         | POST                               | PATCH                                                                                                                                                                                                                                               | DELETE /api/v1/users*`         | ❌ Not built                                            | `User` module has models + Fortify actions + DTOs, **but no HTTP controllers or routes**. |
| **User**                       | Profile columns (`first_name`, `last_name`, `avatar_url`, `phone`, `locale`, `timezone`)     | ❌ Not built                       | `users` table has a single `name` column. `profiles` satellite table is planned but not migrated.                                                                                                                                                   |
| **Scope — Organization**       | Any endpoint                                                                                 | ❌ Not built                       | Module doesn't exist. Frontend switchers run on fixtures.                                                                                                                                                                                           |
| **Scope — Branch**             | Any endpoint                                                                                 | ❌ Not built                       | Same.                                                                                                                                                                                                                                               |
| **Scope — Team**               | Any endpoint                                                                                 | ❌ Not built                       | Same.                                                                                                                                                                                                                                               |
| **Scope — Season**             | Any endpoint                                                                                 | ❌ Not built                       | Same.                                                                                                                                                                                                                                               |
| **Scope — Region**             | Any endpoint                                                                                 | ❌ Not built                       | Same.                                                                                                                                                                                                                                               |
| **Access**                     | `GET /api/v1/permissions`, `GET /api/v1/roles`                                               | ❌ Not built + **unseeded**        | Module has just `Role`/`Permission` Eloquent models; no seeder, no `manage-tenants` permission row, no default tenant role tree. Gap G2.                                                                                                            |
| **FeatureFlag (SPA readable)** | `GET /api/v1/features`                                                                       | ❌ Not built                       | Only platform‑admin toggle endpoint exists. Gap G10.                                                                                                                                                                                                |
| **Foundation**                 | `GET /api/ping`, `GET /api/health`, `/up`                                                    | ✅ Ready                           | Health checks.                                                                                                                                                                                                                                      |

**Bottom line**: `Tenant`, `Auth (tenant)`, `Auth (platform)` are fully ready to
wire from the SPA today. `User` (aside from the identity embedded in the login
DTO) and every `Scope` surface are **not** ready — those resources must stay on
the mock provider until their backend modules land.

---

## 0. Executive summary

The backend is a **modular monolith** with six modules currently in place —
**Foundation, Tenancy, User, Auth, Access, FeatureFlag** — plus stub
`Organization` support that has not been implemented yet. Tenancy is
**single‑database, subdomain‑identified** (`{slug}.stackra.app`) using
`stancl/tenancy`, with a strict **two‑audience** design:

- **Tenant surface** — `/api/auth/*` on tenant hosts (subdomain), issues
  `sanctum` tokens for `App\User\Models\User` (tenant employees/members). 2FA
  columns exist but Fortify's `TwoFactorAuthenticatable` trait is **not**
  applied to the tenant User yet, so tenant 2FA endpoints return
  `501 Not Implemented`.
- **Platform surface** — `/api/v1/platform/auth/*` on the central domain, issues
  `sanctum` tokens for `App\User\Models\PlatformUser` (Stackra staff). **2FA
  is mandatory** with a full flow
  (enable/confirm/challenge/disable/recovery‑codes). Adds token‑based
  impersonation into any tenant user.

The frontend today assumes a **single** auth surface (`/auth/login` returning a
rich flat `{token, user, features, permissions, tenants[], scopes[]}`), a
`me.json` bootstrap with a `terminology` map, and mocked resources for 40+
domain modules (athletes, teams, seasons, payments, …) that **do not exist in
the backend yet**.

To align, we do three things simultaneously:

1. **Refactor the frontend** so the identity/tenancy/auth/HTTP layers match what
   the backend actually exposes (bearer‑token, subdomain‑resolved tenant,
   snake_case DTOs, `{message,status,data,meta}` envelope, split tenant/platform
   auth surfaces, **Refine multi‑data‑provider** with `default: rest` + `mock`
   so each resource migrates independently).
2. **Build the missing auth surface** (all auth pages, Slack‑style workspace
   picker, 2FA + impersonation UX, custom‑domain support).
3. **Document explicit backend gaps** the frontend requires — a `/me` bootstrap
   endpoint, seeded permissions/roles,
   `User`/`Organization`/`Branch`/`Team`/`Season` HTTP surfaces, richer
   `UserData`/profile, terminology response — so the backend team can implement
   them in a matching phase.

**What's ready to wire today** (see §0.a for the full matrix): `Tenant`
(`/api/current-tenant` + platform `/api/v1/tenants/*`) and `Auth` (full tenant +
platform surfaces including 2FA + impersonation). `User` has only the compact
DTO embedded in the login response (no `/me`, no `/users` CRUD). `Scope`
(Organization/Branch/Team/Season/Region) has zero backend today. That's why the
migration is multi‑provider: turn on real endpoints resource‑by‑resource, keep
everything else on the mock provider.

---

## 1. Backend reality — what actually exists

### 1.1 Modules present

| Module                | Purpose                                                                                                                                                                                                                     | State                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Foundation**        | Base `Controller`, `ApiResponses` envelope trait, rate limiting, health checks, schema macros                                                                                                                               | ✅ implemented         |
| **Tenancy**           | `stancl/tenancy` single‑DB, `Tenant`/`Domain`/`TenantSetting`/`TenantBranding` models, `BusinessType` enum, `TenantState` machine, central `POST/GET/PUT/DELETE /api/v1/tenants`, `GET /api/current-tenant` on tenant hosts | ✅ implemented         |
| **User**              | Two models: `User` (tenant, `sanctum` guard, UUID) and `PlatformUser` (central, `platform_admin` guard, int id, `TwoFactorAuthenticatable`), each with its own `UserState` machine (Pending/Active/Disabled)                | ✅ implemented         |
| **Auth**              | Full tenant + platform auth surface (see §1.3). Delegates to Fortify actions where possible, hand‑rolls custom flows (impersonation, platform password broker)                                                              | ✅ implemented         |
| **Access**            | Just `Role` + `Permission` Eloquent models mapped to spatie/laravel‑permission tables, with separated guards. **No permission strings or roles seeded yet.**                                                                | 🟡 skeleton only       |
| **FeatureFlag**       | `Feature` enum with 8 keys, pennant‑backed per‑tenant flags, `GET/PUT /api/v1/tenants/{tenant}/features/{feature}` platform admin endpoints. **No `/api/features` endpoint for the tenant SPA yet.**                        | 🟡 platform admin only |
| **Foundation health** | `GET /api/ping`, `GET /api/health`, `/up`                                                                                                                                                                                   | ✅                     |

### 1.2 Modules that DO NOT exist yet (frontend has mocks for all of them)

- **Organization** (Organization, Branch, Team, TeamMember)
- **Geo/Region** (Region, RegionCountry)
- **Season** (referenced by Team/Athlete but not modeled)
- **Athlete/Guardian**, **Registration**, **Event**, **Match/Training/Session**,
  **Attendance**, **Progress**, **Performance**, **Medical**, **Drill**,
  **Development plan**, **Award**, **Formation**, **Standing**,
  **Safeguarding**, **Payments/Invoices**, **Membership**, **Expense**,
  **Credential**, **Announcement**, **Conversation**, **Lead**, **Pass**,
  **Integration**, **Public site page** — all frontend mocks, no backend module
  yet.

**Implication**: only auth + tenancy + features can be wired end‑to‑end right
now. Everything else must keep the mock provider or the frontend must accept
404s as it iterates.

### 1.3 Endpoint map (verified against `modules/*/routes/`)

#### Tenant surface — served on `{slug}.stackra.app`, prefix `/api`

The `tenant` middleware group (`InitializeTenancyByDomain` +
`PreventAccessFromCentralDomains`) is applied to everything under this prefix.
`tenant()` is always the resolved tenant inside these routes.

| Method + path                                                                 | Auth                                            | Purpose                                                                                                       |
| ----------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/current-tenant`                                                     | none                                            | Returns `TenantData` for the host‑resolved tenant. Used by the SPA to bootstrap the workspace on load.        |
| `POST /api/auth/login`                                                        | throttle `login` (5/min per email+IP)           | Body `{email, password, device_name?}` → `AuthTokenData` or `TwoFactorRequiredData`                           |
| `POST /api/auth/logout`                                                       | `auth:sanctum` + `tenant.user`                  | Revokes presenting token                                                                                      |
| `POST /api/auth/refresh`                                                      | `auth:sanctum` + `tenant.user`                  | Rotates the token, re‑encodes abilities                                                                       |
| `POST /api/auth/register`                                                     | throttle 6/min                                  | Body `{name, email, password, password_confirmation}` → `UserData` (201, no token — user must login)          |
| `GET /api/auth/email/verify`                                                  | `auth:sanctum` + `tenant.user`                  | Returns `{verified: bool, email: string}`                                                                     |
| `GET /api/auth/email/verify/{id}/{hash}`                                      | `signed` + throttle 6/min                       | Consumes the emailed signed URL                                                                               |
| `POST /api/auth/email/verification-notification`                              | `auth:sanctum` + `tenant.user` + throttle 6/min | Resends the verification email                                                                                |
| `POST /api/auth/forgot-password`                                              | throttle 6/min                                  | Body `{email}` → **always** 200 (no user enumeration)                                                         |
| `POST /api/auth/reset-password`                                               | throttle 6/min                                  | Body `{token, email, password, password_confirmation}` → revokes all tokens, no new token issued (must login) |
| `POST /api/auth/confirm-password`                                             | `auth:sanctum` + `tenant.user`                  | Body `{password}` → writes a step‑up marker keyed to the current token id                                     |
| `POST /api/auth/change-password`                                              | `auth:sanctum` + `tenant.user`                  | Body `{current_password, password, password_confirmation}` → revokes all _other_ tokens                       |
| `POST /api/auth/two-factor/{enable,confirm,disable,challenge,recovery-codes}` | mixed                                           | **Currently returns HTTP 501** — tenant 2FA is deferred until `User` gets `TwoFactorAuthenticatable`          |

#### Platform surface — served on central domain, prefix `/api/v1/platform/auth`

The `platform.domain` middleware rejects tenant hosts with 404. The
`platform.user` middleware rejects any Sanctum token minted for a tenant `User`
with 403.

| Method + path                   | Auth                                                                               | Purpose                                                                                          |
| ------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `POST .../login`                | `platform.domain` + throttle `platform-login` (3/min per email+IP, 30/hour per IP) | Same body as tenant login → `AuthTokenData`/`TwoFactorRequiredData`                              |
| `POST .../logout`               | + `auth:sanctum` + `platform.user`                                                 | Also revokes every impersonation token minted by this admin                                      |
| `POST .../refresh`              | + `auth:sanctum` + `platform.user`                                                 |                                                                                                  |
| `POST .../forgot-password`      | throttle 6/min                                                                     | Uses **`platform_users` broker** (separate `platform_password_reset_tokens` table)               |
| `POST .../reset-password`       | throttle 6/min                                                                     | Revokes all admin tokens                                                                         |
| `POST .../confirm-password`     | `auth:sanctum` + `platform.user`                                                   |                                                                                                  |
| `POST .../change-password`      | + `ensure_2fa_enabled`                                                             | 2FA mandate applies                                                                              |
| `POST .../two-factor/enable`    | `auth:sanctum` + `platform.user`                                                   | Generates secret + returns provisioning URL/QR                                                   |
| `POST .../two-factor/confirm`   | `auth:sanctum` + `platform.user`                                                   | Confirms + mints a full‑ability token (revokes the restricted enrolment token)                   |
| `POST .../two-factor/challenge` | throttle `two-factor` (5/min per challenge+IP)                                     | Body `{challenge_token, code                                                                     | recovery_code}`→`AuthTokenData` |
| `GET                            | POST .../two-factor/recovery-codes`                                                | + `ensure_2fa_enabled` + `password.confirm`                                                      | Get or regenerate codes         |
| `POST .../two-factor/disable`   | + `password.confirm`                                                               | **Always 403** — platform admins cannot disable 2FA                                              |
| `POST .../impersonate`          | + `ensure_2fa_enabled` + `can:manage-tenants` + `password.confirm`                 | Body `{tenant_id, tenant_user_id, ttl_minutes?, device_name?}` → short‑lived impersonation token |
| `POST .../impersonate/stop`     | tenant‑side token                                                                  | Revokes the impersonation token, returns success                                                 |

#### Platform admin — tenant management (central, prefix `/api/v1`)

Requires `auth:sanctum` + `can:manage-tenants` + `api.version`.

- `GET|POST /api/v1/tenants`
- `GET|PUT|DELETE /api/v1/tenants/{tenant}`
- `POST /api/v1/tenants/{tenant}/{activate,suspend,deactivate,cancel-deletion}`
- `GET /api/v1/tenants/{tenant}/features`
- `PUT /api/v1/tenants/{tenant}/features/{feature}`

### 1.4 Response envelope (Foundation `ApiResponses` trait)

**Every controller extending the Foundation `Controller`** produces this success
envelope:

```json
{
  "message": "…",
  "status": 200,
  "data": <payload>,
  "meta": { "current_page": 1, "per_page": 15, "from": 1, "to": 15, "total": 42, "last_page": 3 }
}
```

- `meta` is only present when non‑empty; for paginators it's auto‑lifted from
  the `AbstractPaginator`.
- `201 Created` uses `apiCreated()`.
- `204 No Content` uses `apiNoContent()` (body is `null`).

**Auth module DOES NOT use this envelope.** Auth controllers return **the DTO
directly** via `new JsonResponse($result->toArray())`. So the login response is
a flat:

```json
{
  "access_token": "…",
  "token_type": "Bearer",
  "abilities": ["*"],
  "risk_score": 0,
  "user": {
    "id": "…",
    "name": "…",
    "email": "…",
    "email_verified_at": "…",
    "status": "active",
    "last_login_at": "…"
  },
  "expires_at": null,
  "recovery_codes_remaining": null,
  "two_factor_setup_required": false
}
```

**Frontend implication**: our current mock login returns
`{token, risk_score, user}` — close but wrong field names. Real backend uses
`access_token` and adds `token_type`, `abilities`, `expires_at`, etc. The data
provider must handle **two envelopes**: the auth flat DTO, and the Foundation
`{data, meta}` envelope for everything else.

Error envelope (Laravel default validation + `DomainException`):

```json
// 422
{ "message": "The given data was invalid.", "errors": { "email": ["Required."] } }
// 401 / 403 / 404 / other
{ "message": "…" }
```

### 1.5 Tenant identification

Configured in `config/tenancy.php`:

- **Identification middleware**: `InitializeTenancyByDomain` — reads the
  **request host** and looks up a matching `Domain` row (`tenants` ⇢ has‑many
  `Domain`).
- **Central domains**: env `TENANCY_CENTRAL_DOMAINS` (default
  `localhost,127.0.0.1`), e.g.
  `stackra.app,www.stackra.app,api.stackra.app`.
- **Custom domains supported** — any `Domain` row hosts a tenant (both
  `{slug}.stackra.app` and `academy.example.com` are stored the same way).
- **No** header‑based tenant resolver is configured. `X‑Tenant` etc. is **not**
  honored today; if we want SPA‑set tenant, backend must add
  `InitializeTenancyByRequestData` middleware — this is listed as a **backend
  gap** if we choose that route.

### 1.6 CORS + Sanctum

- `config/cors.php`: `paths=['api/*']`, `allowed_methods=['*']`,
  `allowed_headers=['*']` (wildcard — our custom `X-*` headers are already
  permitted), `supports_credentials=false`, `allowed_origins` from
  `CORS_ALLOWED_ORIGINS` env (comma‑separated). **Backend must configure this
  env with our frontend origins** (`https://stackra.app`,
  `https://*.stackra.app`, `https://stackra.vercel.app`, dev origins).
- `config/sanctum.php`: `guard=['web']`, `expiration=null` (tokens are
  long‑lived; the app rotates via `/refresh`). Bearer‑token, not SPA cookies.
- `config/fortify.php`: `views=false`, `routes=false` — Fortify never mounts
  routes; only its actions are reused.

### 1.7 Data model — key fields the frontend needs to know

**`tenants`** (`stancl` VirtualColumn — real columns below; everything else
lands in `data` JSON)

- `id` (UUID), `name`, `slug`, `status` (`trialing|active|suspended|inactive`),
  `business_type`
  (`sports_center|gym|activity_center|club|academy|multi_sport`), `purge_at`
  (nullable), `created_at`, `updated_at`.

**`domains`** — `id`, `tenant_id`, `domain`.

**`tenant_brandings`** — `tenant_id`, plus branding fields (colors, logo URL,
etc. — see model).

**`tenant_settings`** — key/value.

**`users`** (tenant)

- `id` (UUID), `tenant_id`, `name` (single field — **no**
  `first_name`/`last_name`), `email`, `email_verified_at`, `password`, `status`
  (`pending|active|disabled`), `last_login_at`, `last_login_ip`, `login_count`,
  timestamps + `deleted_at`.
- **Missing** (compared to the frontend's expectations): `first_name`,
  `last_name`, `display_name`, `avatar_url`, `phone`, `phone_verified_at`,
  `locale`, `timezone`, `preferred_language`. These live conceptually on a
  `profiles` PII satellite in the identity spec but that table has NOT been
  created yet.

**`platform_users`** — same shape as `users` minus `tenant_id`, plus three
encrypted 2FA columns (`two_factor_secret`, `two_factor_recovery_codes`,
`two_factor_confirmed_at`).

### 1.8 Business types + feature flags (behaviour-in-code)

`BusinessType` enum:

- **Values**: `sports_center`, `gym`, `activity_center`, `club`, `academy`,
  `multi_sport`.
- **`->terminology()`** returns a map (e.g. `academy` →
  `{athlete: "Student", team: "Class"}`) — this is the source of truth the
  frontend must consume for per‑tenant labels.
- **`->defaultFeatures()`** returns a base set
  (`athletes, teams, scheduling, attendance`) plus type‑specific extras
  (`competition, progress, development, multi_sport`).
- **`->defaultRoles()`** returns the seeded role list (owner, admin,
  branch_manager, coach, athlete, parent_guardian, front_desk, viewer + optional
  `medical`).

`Feature` enum (pennant, tenant‑scoped): 8 keys —
`athletes, teams, scheduling, attendance, competition, progress, development, multi_sport`.
Currently only admin can toggle; **no tenant‑user readable endpoint exists yet**
(a gap).

---

## 2. Frontend reality — what we have

- **Auth**: `authProvider` (mock + REST) reads a fixture `/data/me.json` or
  `/data/demo-users.json` (Wave 5) for the identity. Login accepts any password
  in mock mode; REST mode expects a flat `{token, user}` at `POST /auth/login`.
- **Identity shape**:
  `{id, name, initials, email, avatar_url, roles[], permissions[], features[], terminology{}, tenant, tenants[], scopes: {organizations[], branches[], seasons[]}}`
  — richer than the backend currently returns.
- **Data provider**: expects
  `{data, meta: {current_page, per_page, total, last_page, from, to}}` for lists
  (matches the backend envelope). Uses Refine's spatie query builder adapter.
- **Scope layer** (`src/lib/scope/`): persists org/branch/season locally,
  provides switchers, injects filters into list requests via `AllowedScopes`.
  Backend has **no** Organization/Branch/Season, so today this filters nothing
  when talking to the backend.
- **Modules**: 40+ Refine resources with lists/create/edit/show, all backed by
  JSON fixtures.
- **RBAC**: `accessControlProvider` maps Refine actions to policy abilities;
  `useCan` gates buttons and pages. The mock personas ship curated `permissions`
  lists.
- **HTTP client** (`src/lib/http/`): a light Axios instance today; needs the
  upgrades listed in §6.

---

## 3. Alignment strategy — the three decisions

### 3.1 Tenant identification — subdomain, not header

Adopt the backend's model as‑is: the SPA lives at `{slug}.stackra.app` and
the browser sends requests to `https://{slug}.stackra.app/api/*`. This is the
Slack model.

**Alternatives rejected**:

- ~~Header‑only (`X-Tenant`)~~ — backend has no `InitializeTenancyByRequestData`
  and each tenant needs isolated cache/queue/fs prefixes that stancl derives
  from the host anyway.
- ~~Path‑based (`/t/{slug}/…`)~~ — bigger backend refactor, breaks the same
  isolation.

**Concrete implications**:

- Frontend deployment must serve the same SPA build under any tenant subdomain
  (Vercel wildcard, or one CNAME per custom domain). Runtime code reads
  `window.location.hostname` to know the tenant slug and whether we're on the
  central host.
- The central host renders a **workspace picker** page (public) that redirects
  to `https://{slug}.stackra.app` on selection.
- On any subdomain page load, the SPA calls `GET /api/current-tenant` to
  bootstrap branding/name (public — no auth) and stores it in a `TenantContext`.

### 3.2 Two auth surfaces — split providers

The frontend must expose **two auth flows** because the backend has two:

- **Tenant auth** — used on `{slug}.stackra.app`.
  Login/register/forgot/reset/verify/change/confirm/logout/refresh. 2FA UI
  stubbed out for now (backend returns 501).
- **Platform admin auth** — used on `admin.stackra.app` (or however we name
  the central admin surface). Login + mandatory 2FA enrolment + full 2FA
  challenge + impersonation.

We ship **one SPA build** but the auth provider selects the right endpoint set
at runtime based on the host, and the workspace picker + tenant management
screens are visible only on the central host.

### 3.3 Bearer‑token, not SPA cookies

Backend uses `sanctum` PATs, `expiration=null`. Frontend stores the token in
memory + `localStorage` (already the pattern), sends it as
`Authorization: Bearer …`, and calls `/api/auth/refresh` (or
`/api/v1/platform/auth/refresh`) as needed.

**Explicit non‑goals**:

- Do **not** attempt SPA cookie/CSRF flow (`supports_credentials=false`, no CSRF
  cookie route).
- Do **not** attempt SSO/social login yet (no Socialite providers wired on
  backend).

---

## 4. Frontend refactor plan (detailed)

### 4.1 `src/lib/http` — Axios instance upgrade

The Axios instance must:

**A. Base URL derivation (runtime, not env)**

```
// Given window.location.hostname:
//   "stackra.app"           -> baseURL = "https://stackra.app/api"       (central)
//   "admin.stackra.app"     -> baseURL = "https://admin.stackra.app/api" (central admin)
//   "{slug}.stackra.app"    -> baseURL = "https://{slug}.stackra.app/api" (tenant)
//   "academy.example.com"      -> baseURL = "https://academy.example.com/api"   (custom domain tenant)
//   "localhost:3000"           -> baseURL = env.VITE_API_URL (dev, points at backend)
```

Add helpers: `resolveHostContext()` returning
`{ kind: "central" | "tenant" | "central-admin", host, tenantSlug?: string }`.

**B. Request interceptor — attach headers**

Every request:

- `Authorization: Bearer {token}` when authenticated.
- `Accept: application/json`.
- `X-Requested-With: XMLHttpRequest`.
- `X-Api-Version: 1.0` — read by the `api.version` middleware.
- `X-Client: stackra-web/{version}` — from `package.json`.
- `X-Device-Id: {stable-uuid}` — generated once in `localStorage`, sent so
  backend can associate login/session records with a device. **Backend gap**: no
  middleware reads this yet; documented as gap G8.
- `X-Device-Name: {os} {browser}` — human‑readable, matches Sanctum's
  `device_name` login field.
- `X-Device-Platform: {os}` — `macOS 15.0`, `iOS 17.5`, `Android 14`,
  `Windows 11` (from `navigator.userAgentData` with UA fallback).
- `X-Device-Type: {desktop|mobile|tablet}`.
- `X-Timezone: {IANA}` — `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- `X-Locale: {bcp47}` — the current UI locale (`en` or `ar`).
- `Accept-Language: {en-US,en;q=0.9,ar;q=0.8}` — HeroUI‑neutral, browser
  standard.

**Note on scope headers (`X-Tenant`, `X-Organization`, `X-Branch`,
`X-Season`)**: since the tenant is resolved by the host, we do **not** send
`X-Tenant`. For org/branch/season, we recommend sending them as **query params**
(`filter[organization_id]=…`) because:

- Backend has no `Organization` module yet — no middleware to read these
  headers.
- Query params work with the existing spatie/query‑builder pattern the frontend
  already uses.
- Once the backend adds Organization/Branch/Season, they can optionally add
  `X-Organization` / `X-Branch` / `X-Season` middleware that sets a
  request‑scoped default — but the query‑param path is the ground truth.
  Documented as gap G6.

**C. Response interceptor — dual envelope handling**

- If body has `data` and `message`/`status` → treat as Foundation envelope
  (unwrap `data` for `useOne`/`useShow`, keep `meta` for `useList`).
- If body has `access_token` → treat as `AuthTokenData` (auth flow).
- Otherwise pass through.

**D. Error interceptor**

- `401` → clear token, redirect to `/login` (or workspace picker on central
  host).
- `403` with `error_code: platform_two_factor_required` → redirect to 2FA setup
  screen.
- `423` (account locked) → surface `Retry-After` header.
- `429` → surface rate‑limit toast.
- `422` → normalize `errors` shape and hand to the form.

**E. Refresh flow**

Queue in‑flight requests, call `/api/auth/refresh`, retry the queue. Do this on
`401` responses when we still have a refresh window.

Files:

```
src/lib/http/
  client.ts         # createHttpClient(): AxiosInstance
  host.ts           # resolveHostContext()
  device.ts         # deviceHeaders(): Record<string,string>, deviceId(): string
  envelope.ts       # unwrapEnvelope<T>(): T; isPaginated<T>(): boolean
  errors.ts         # ApiError, isValidationError, etc.
  refresh.ts        # attachRefreshFlow(client)
```

### 4.2 `src/lib/tenancy` — new library

Owns the **tenant workspace** identity (distinct from `lib/scope` which handles
the org/branch/season inside a tenant).

```
src/lib/tenancy/
  tenant.types.ts        # TenantWorkspace, TenantBranding
  tenant-context.tsx     # TenantProvider (loads /api/current-tenant on tenant hosts)
  use-tenant.ts          # useTenantWorkspace() -> {tenant, branding, isCentral}
  workspace-list.ts      # useMyWorkspaces() -> lists tenants the user belongs to
  workspace-picker.tsx   # Slack-style picker component
  index.ts
```

Public API:

- `useTenantWorkspace()` — returns the current tenant workspace (`null` on
  central host).
- `useMyWorkspaces()` — returns `{ workspaces: TenantWorkspace[], isLoading }`.
  Fetches `GET /api/v1/auth/workspaces` (**backend gap G3** — new endpoint
  needed).
- `switchWorkspace(slug)` — sets
  `window.location = "https://{slug}.stackra.app"` (a full navigation because
  the request host must change).

### 4.3 `src/lib/scope` — keep, refine

- Rename `TenantSwitcher` → `WorkspaceSwitcher` and move it to `lib/tenancy`.
- Keep `OrganizationSwitcher`, `BranchSwitcher`, `SeasonSwitcher` in
  `lib/scope`.
- Since Organization/Branch/Season don't exist on the backend yet, the switchers
  stay data‑driven from `me.json.scopes.*` (fixtures) — when the backend
  implements them, they'll wire to `GET /api/v1/organizations`, `/branches`,
  `/seasons`.

### 4.4 `src/providers/auth` — rewrite for the real backend

Two providers, chosen at construction time from the host:

```
src/providers/auth/
  auth-provider.tenant.ts       # tenant surface flows
  auth-provider.platform.ts     # platform admin flows (2FA mandatory)
  auth-provider.mock.ts         # kept for the fixture demo
  index.ts                      # exports the resolved provider
  session.ts                    # in-memory token store + localStorage backup
  map-identity.ts               # backend User/PlatformUser -> Identity
  password-policy.ts            # mirrors backend's PasswordPolicy (min 12, letters, digits)
```

**Tenant provider — endpoint calls**

- `login({email, password, device_name})` → `POST /api/auth/login`. On
  `two_factor_required`, redirect to `/2fa/challenge` (currently returns 501, so
  display "Contact your admin" until §backend enables it). On success, store
  token, redirect to `/dashboard`.
- `logout()` → `POST /api/auth/logout`.
- `refresh()` → `POST /api/auth/refresh`.
- `register(...)` → `POST /api/auth/register`, then redirect to `/login`.
- `forgotPassword({email})` → `POST /api/auth/forgot-password`, always success
  message.
- `resetPassword({token, email, password, password_confirmation})` →
  `POST /api/auth/reset-password`, redirect to `/login`.
- `confirmPassword({password})` → `POST /api/auth/confirm-password` for step‑up.
- `changePassword({current_password, password, password_confirmation})` →
  `POST /api/auth/change-password`.
- `emailVerificationNotice()` → `GET /api/auth/email/verify`.
- `sendEmailVerification()` → `POST /api/auth/email/verification-notification`.

**Platform provider — endpoint calls**

- All of `login/logout/refresh/forgot/reset/confirm/change` but on
  `/api/v1/platform/auth/*`.
- 2FA flow: `two-factor/{enable,confirm,challenge,disable,recovery-codes}`.
- Impersonation: `POST /api/v1/platform/auth/impersonate` and its stop
  counterpart.

**Identity mapping (`map-identity.ts`)**

The backend's login response has a **minimal** user
(id/name/email/email_verified_at/status/last_login_at). The frontend's
`Identity` needs `roles`, `permissions`, `features`, `terminology`, `tenant`,
`tenants[]`, `scopes` — **none of which exist on the login response today**.

We resolve this by calling a `/me` bootstrap endpoint immediately after login
(or on app boot when a token exists) — this endpoint **needs to be built on the
backend** (gap G1). Until it exists, `map-identity` falls back to fixtures for
the missing fields so the app keeps working end‑to‑end during the transition.

### 4.5 `src/providers/data` — multi‑provider migration strategy

The frontend runs against a mock JSON backend today and must move to the real
REST API **one resource at a time**. Refine's built‑in multi‑provider support
([docs](https://refine.dev/docs/data/data-provider/#multiple-data-providers)) is
exactly the seam we want.

**How it works**

Instead of a single `dataProvider`, `<Refine>` accepts a **map** of named
providers, one of which is `default`:

```tsx
<Refine
  dataProvider={{
    default: restDataProvider,   // → talks to /api on the current host
    mock:    mockDataProvider,   // → reads /data/*.json fixtures
    // Future examples:
    // platform: platformRestDataProvider, // → /api/v1/... on central host
    // reporting: readOnlyReportsProvider, // → a separate service later
  }}
  resources={[
    // Live: goes through `default`
    { name: "tenants",       list: "/tenants",       meta: { dataProviderName: "default" } },
    // Not-yet-built on backend: pinned to mock
    { name: "athletes",      list: "/athletes",      meta: { dataProviderName: "mock" } },
    // …
  ]}
>
```

Refine reads `meta.dataProviderName` per resource; a call site can also opt in
at runtime via `useList({ dataProviderName: "mock" })` (same for `useOne`,
`useCreate`, `useForm`, etc.). If nothing is specified, `default` is used.

**Concrete wiring** (in `src/providers/data/`)

```
src/providers/data/
  rest-provider.ts        # Real REST — Foundation envelope, /api base URL from host
  mock-provider.ts        # Existing JSON‑fixture provider (unchanged, kept as-is)
  platform-provider.ts    # (later) REST + /api/v1 prefix + central host for admin surface
  index.ts                # exports the provider map
```

`index.ts`:

```ts
import { httpClient } from "@/lib/http";
import { createMockDataProvider } from "@/providers/data/mock-provider";
import { createRestDataProvider } from "@/providers/data/rest-provider";

export const dataProviders = {
  default: createRestDataProvider(httpClient),
  mock: createMockDataProvider(),
  // platform: createPlatformDataProvider(...)
} as const;

export type DataProviderName = keyof typeof dataProviders;
```

**Per‑resource migration matrix** — this drives the incremental switch. Update
`meta.dataProviderName` in each resource's `*.module.tsx` as backend endpoints
land:

| Resource(s)                                                                                                         | Provider today           | Provider target                                 | Backend blocker                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| `tenants` (platform admin CRUD)                                                                                     | `mock`                   | `default` (or `platform`)                       | ✅ **Ready** — flip in Phase 3.                                                    |
| `current-tenant` (bootstrap)                                                                                        | n/a — direct `useCustom` | direct `httpClient.get('/current-tenant')`      | ✅ **Ready** — Phase 1.                                                            |
| `features` (tenant SPA read)                                                                                        | `mock`                   | `default`                                       | Gap G10.                                                                           |
| `auth` (login/logout/refresh/…)                                                                                     | mock auth provider       | tenant/platform auth providers                  | ✅ **Ready** — Phase 2 (auth is not a Refine `dataProvider`, it's `authProvider`). |
| `me` (identity bootstrap)                                                                                           | fixture                  | direct `httpClient.get('/auth/me')` after login | Gap G1 closed — see BACKEND_HANDOFF.md §5.1.                                       |
| `workspaces` (Slack picker)                                                                                         | fixture                  | direct `httpClient.get('/v1/auth/workspaces')`  | Gap G3.                                                                            |
| `users`                                                                                                             | `mock`                   | `default`                                       | No backend module — stays on mock.                                                 |
| `roles`, `permissions`                                                                                              | `mock`                   | `default`                                       | Gap G2 (seeder + endpoints).                                                       |
| `organizations`, `branches`, `teams`, `seasons`                                                                     | `mock`                   | `default`                                       | Gap G6 (Organization module).                                                      |
| `athletes`, `enrollments`, `guardians`                                                                              | `mock`                   | `default`                                       | No backend module.                                                                 |
| `events`, `matches`, `training-sessions`, `sessions`, `attendance`, `progress`                                      | `mock`                   | `default`                                       | No backend module.                                                                 |
| `invoices`, `memberships`, `expenses`, `payments`, `subscription`                                                   | `mock`                   | `default`                                       | No backend module.                                                                 |
| `performance`, `medical`, `development`, `drills`, `competitions`, `formations`, `safeguarding`, `awards`           | `mock`                   | `default`                                       | No backend module.                                                                 |
| `announcements`, `conversations`, `leads`, `passes`, `integrations`, `public-site`, `offline-sync`, `reports`, `ai` | `mock`                   | `default`                                       | No backend module.                                                                 |

**How a resource actually gets migrated** (repeatable, one PR per resource):

1. Backend team ships the module + REST endpoints for `<resource>`.
2. Backend endpoint is smoke‑tested with `curl` against a real tenant subdomain.
3. In the resource's `*.module.tsx`, change `meta.dataProviderName` from
   `"mock"` to `"default"` (or remove the meta entirely — `default` is
   implicit).
4. Delete the resource's fixture from
   `apps/dashboard/public/data/<resource>.json` (or keep it for the
   storybook/tests — TBD).
5. Run the frontend against the real backend on `localhost` or a preview deploy;
   smoke‑test the list/show/create/edit flows.
6. Commit + merge — no other module is affected because they're still pointed at
   `mock`.

**Why not a single provider with a runtime `USE_REAL_API=[…]` allow‑list?**

- The multi‑provider pattern is Refine‑native; hooks, buttons, and `<CanAccess>`
  all resolve `dataProviderName` correctly without shim code.
- Per‑resource `meta` lives next to the resource declaration — the truth is
  co‑located with the module, not in a config file elsewhere.
- Migration is a **one‑line edit + a delete**; reviews are trivial.

**Envelope handling inside `default` (REST)**

The REST provider unwraps Foundation's `{message, status, data, meta}` envelope
in one place — Refine wants `{data, total}` from `getList`, `{data}` from
`getOne`/`create`/`update`, and `{data}` from `deleteOne`. Mapping:

- `getList` →
  `{ data: body.data, total: body.meta?.total ?? body.data.length }`.
- `getOne` / `create` / `update` → `{ data: body.data }`.
- `deleteOne` → `{ data: body.data ?? null }` (backend returns 204 → response
  interceptor produces `{data: null}`).

Query params for lists (spatie/query‑builder contract, already used by the mock
provider):

- `page`, `per_page` (Laravel paginator).
- `sort=-created_at,name`.
- `filter[field]=value` for `eq`/`in`/`contains` (comma‑joined values).
- `filter[field][gte]=value` (and `lte`, `between`, `null`) for operator
  filters.
- `include=branch,team` for eager loading.

**Auth surface note** — auth is a Refine `authProvider`, not a `dataProvider`.
Multi‑provider doesn't apply there; instead we pick the tenant vs platform auth
provider by host at construction time (§4.4).

### 4.6 `src/config/env.ts`

Add:

- `VITE_PLATFORM_ADMIN_HOST` — e.g. `admin.stackra.app` (which subdomain
  hosts the platform admin surface).
- `VITE_CENTRAL_HOST` — e.g. `stackra.app` (the workspace‑picker host).
- `VITE_API_PATH` — default `/api`.
- Keep `VITE_API_URL` as the dev‑mode override (still used when running Vite on
  `localhost:3000`).

### 4.7 File map — new + modified

```
NEW
  src/lib/http/{client,host,device,envelope,errors,refresh}.ts
  src/lib/tenancy/{tenant.types,tenant-context,use-tenant,workspace-list,workspace-picker,index}.ts
  src/providers/auth/auth-provider.tenant.ts
  src/providers/auth/auth-provider.platform.ts
  src/providers/auth/password-policy.ts
  src/modules/auth/pages/forgot-password.tsx
  src/modules/auth/pages/reset-password.tsx
  src/modules/auth/pages/register.tsx
  src/modules/auth/pages/verify-email.tsx
  src/modules/auth/pages/verify-email-notice.tsx
  src/modules/auth/pages/two-factor-challenge.tsx
  src/modules/auth/pages/two-factor-setup.tsx        # platform surface
  src/modules/auth/pages/confirm-password.tsx
  src/modules/auth/pages/change-password.tsx
  src/modules/auth/pages/impersonation-banner.tsx    # visible when acting as another user
  src/modules/workspace/pages/pick.tsx               # Slack-style picker (central host)
  src/modules/workspace/workspace.module.tsx

MODIFIED
  src/lib/http/*                                     # rewrite Axios instance
  src/providers/auth/index.ts                        # pick tenant vs platform at runtime
  src/providers/auth/map-identity.ts                 # /me bootstrap + fallback
  src/providers/auth/session.ts                      # persist refresh, expiry
  src/providers/data/*                               # dual-envelope unwrap
  src/modules/auth/auth.module.tsx                   # register all new routes
  src/App.tsx                                        # host-aware routing (central vs tenant vs admin)
  src/lib/scope/scope-context.tsx                    # decouple from me.json when backend serves it
  apps/dashboard/public/data/demo-users.json         # align to backend UserData shape (see §7)
  apps/dashboard/public/data/me.json                 # align (see §7)
```

---

## 5. Auth pages + flows to build (Slack‑style workspace + full auth suite)

### 5.1 Central host — public routes

- `/` — **workspace picker**: if the visitor has an active session cookie
  (unlikely — we're bearer‑token) or a remembered slug in `localStorage`,
  redirect to `https://{slug}.stackra.app`. Otherwise show a two‑step wizard:
  1. "Sign in to your workspace" — enter workspace slug or list of workspaces
     the user belongs to (`GET /api/v1/auth/workspaces` — **gap G3**). Anonymous
     users see a "Find your workspace" form that emails them their workspaces
     (**gap G4**).
  2. Click a workspace → full page navigation to
     `https://{slug}.stackra.app/login`.
- `/create-workspace` — sign‑up flow for a new tenant. Calls
  `POST /api/v1/tenants` (currently platform‑admin only — **gap G5**: needs a
  public "self‑serve tenant creation" endpoint).
- `/forgot-workspace` — email me my workspaces (**gap G4**).

### 5.2 Tenant host — public

- `/login` — email + password + `device_name` (auto). Handles
  `two_factor_required` branch (currently 501; show explanatory copy).
- `/register` — name + email + password + confirmation. On success, redirect to
  `/login` with a "check your email" flash.
- `/forgot-password` — email input; always succeeds visually.
- `/reset-password?token=…&email=…` — read from query, submit new password.
- `/verify-email?id=…&hash=…&signature=…` — direct hit from the emailed link; on
  success redirect to `/dashboard`.
- `/verify-email-notice` — protected page (visible after login when
  `email_verified_at` is null); "Resend verification" button.

### 5.3 Tenant host — protected

- `/settings/security/confirm-password` — step‑up confirm.
- `/settings/security/change-password` — current + new + confirmation.
- (Later) `/settings/security/two-factor` — enable/confirm/disable + recovery
  codes, once backend enables tenant 2FA.

### 5.4 Platform admin host — protected

- `/login` — platform login. On `two_factor_setup_required=true` **and** first
  login, redirect to `/2fa/setup`.
- `/2fa/setup` — show QR + secret; POST code to `/two-factor/confirm`. On
  success, download/print recovery codes.
- `/2fa/challenge?challenge_token=…` — six‑digit code OR "Use a recovery code"
  toggle.
- `/settings/security/recovery-codes` — view/regenerate (password step‑up gate).
- `/tenants` — CRUD tenants (existing endpoints).
- `/tenants/{tenant}/impersonate` — kick off an impersonation (password
  step‑up + confirmation modal, then start the tenant session in a new tab).

### 5.5 Global UX affordances

- **Session banner** when impersonating: "You are viewing X as Y. [Stop
  impersonation]".
- **Locked‑account** screen when login returns 423 (surface `Retry-After`).
- **Verification banner** at the top of every protected page when
  `email_verified_at` is null.
- **"Password confirmation required"** modal that pops on any endpoint returning
  428 (custom code) or 409, prompts for password, then retries.

---

## 6. HTTP headers — the full contract

**Sent by the frontend on every API request**

| Header              | Value                      | Consumed today?                               | Notes                                                                                        |
| ------------------- | -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `Authorization`     | `Bearer {token}`           | ✅ Sanctum                                    | Only when authenticated.                                                                     |
| `Accept`            | `application/json`         | ✅                                            | Forces JSON error responses.                                                                 |
| `X-Requested-With`  | `XMLHttpRequest`           | ✅                                            | Laravel's `wantsJson()` shortcut.                                                            |
| `X-Api-Version`     | `1.0`                      | ✅ `api.version` middleware                   | Confirmed used on `/api/v1/tenants*` and `/api/v1/tenants/*/features`.                       |
| `X-Client`          | `stackra-web/{version}` | ❌ (gap G7)                                   | Informational; used server‑side for analytics/logging.                                       |
| `X-Device-Id`       | UUID (stable per browser)  | ❌ (gap G8)                                   | For device/session records.                                                                  |
| `X-Device-Name`     | e.g. `"Chrome on macOS"`   | ❌ (used only as `device_name` in login body) | Redundant to `LoginData.device_name` on login; carried on every request for session tagging. |
| `X-Device-Platform` | e.g. `"macOS 15.0"`        | ❌                                            |                                                                                              |
| `X-Device-Type`     | `desktop\|mobile\|tablet`  | ❌                                            |                                                                                              |
| `X-Timezone`        | IANA tz                    | ❌                                            | Used for scheduling display.                                                                 |
| `X-Locale`          | BCP‑47                     | ❌                                            | Falls back to `Accept-Language`.                                                             |
| `Accept-Language`   | `en-US,en;q=0.9`           | ✅                                            | Standard.                                                                                    |

**NOT sent by the frontend** (documented — sometimes suggested but wrong for
this backend):

- `X-Tenant` — **not** sent; tenant is host‑derived by stancl.
- `X-Organization`, `X-Branch`, `X-Season` — **not** sent as headers; sent as
  query filters (`filter[organization_id]=…` etc.). If the backend later adds
  resolver middleware, we can switch to headers.

**Response headers the frontend should read**

- `X-Api-Version` — echoed by the versioning middleware; useful for deprecation
  banners.
- `Retry-After` — on 423/429.
- `Deprecation` / `Sunset` (RFC 8594) — if backend adds them for deprecated
  versions.

**CORS work required (backend)** — gap G0:

- Set `CORS_ALLOWED_ORIGINS` to the SPA origins:
  `https://stackra.app,https://*.stackra.app,https://stackra.vercel.app,http://localhost:3000,http://127.0.0.1:3000`
  (wildcard subdomains may require Laravel patching; if not supported, list each
  custom domain explicitly).
- Add these to `exposed_headers` in `config/cors.php`:
  `X-Api-Version, Retry-After, Deprecation, Sunset` so the browser lets us read
  them.

---

## 7. Demo JSON alignment

The frontend fixtures pretend to be the real API. Let's align them so we can
flip `VITE_API_MOCK=false` on a per‑endpoint basis as backend modules land.

### 7.1 `apps/dashboard/public/data/demo-users.json`

**Today** (each persona): rich flat identity with
`roles[], permissions[], features[], terminology, tenant, tenants[], scopes.{organizations,branches,seasons}[]`.

**Backend truth**: minimal
`UserData {id, name, email, email_verified_at, status, last_login_at}` on the
tenant surface; no `permissions`/`features`/`terminology`/`tenants`/`scopes`
fields on the User.

**Change plan**:

- Keep `demo-users.json` as our **mock `/me` bootstrap response** (not the login
  response). Rename it internally to `me.json`‑equivalent.
- Trim persona `id` to a UUID string (e.g. `usr_owner` → `01H8XKQ4E4B4Y…`). The
  backend enforces UUIDs on `users.id`.
- Persona shape becomes:

```jsonc
{
  "user": { "id": "…UUID", "name": "Alex Rivera", "email": "…", "status": "active",
            "email_verified_at": "…", "last_login_at": "…" },
  "profile": { "first_name": "…", "last_name": "…", "display_name": "…",
               "avatar_url": null, "phone": null, "locale": "en", "timezone": "America/New_York" },
  "roles": [ "owner" ],
  "permissions": [ "*" ],           // or explicit strings
  "features": [ "athletes", "teams", "scheduling", "attendance", "competition", "progress" ],
  "terminology": { "athletes": "Players" },
  "tenant": { "id": "…", "slug": "riverside", "name": "Riverside Sports Academy",
              "business_type": "academy",
              "branding": { "logo_url": null, "primary_color": null, "favicon_url": null } },
  "tenants": [ /* other workspaces this user belongs to */ ],
  "scopes": { "organizations": [...], "branches": [...], "seasons": [...] }
}
```

- Add a separate `apps/dashboard/public/data/login.json` (or per‑persona)
  matching the **actual** `AuthTokenData` shape so mock login mirrors the real
  backend byte‑for‑byte:

```jsonc
{
  "access_token": "1|mock-owner-XXXXXXXX",
  "token_type": "Bearer",
  "abilities": ["*"],
  "risk_score": 0,
  "user": {
    "id": "…UUID",
    "name": "Alex Rivera",
    "email": "owner@stackra.test",
    "email_verified_at": "…",
    "status": "active",
    "last_login_at": "…",
  },
  "expires_at": null,
  "recovery_codes_remaining": null,
  "two_factor_setup_required": false,
}
```

### 7.2 `apps/web/public/data/me.json`

- Repurpose as the mock **bootstrap** response (`/api/auth/me` — backend gap
  G1). Same shape as a persona in `demo-users.json` (see above).

### 7.3 Fixtures for endpoints the backend already has

- `apps/web/public/data/tenants.json` — align to `TenantData`
  (`id, name, slug, status, status_label, business_type, business_type_label, purge_at, scheduled_for_deletion, created_at, updated_at`).
- `apps/web/public/data/features.json` — array of
  `FeatureFlagData {feature, enabled, source}` (needs to match the backend enum
  keys).

### 7.4 Domain fixtures (modules not yet in backend)

Keep as‑is (they're a spec for the backend to implement later). Add a comment
header to each: "This fixture defines the frontend's expected DTO. Backend
module TBD."

---

## 8. Backend gaps — explicit request list

The frontend cannot fully wire up without these. Grouped by priority.

### 8.1 P0 — required to close the auth loop end‑to‑end

**G1 — `GET /api/auth/me` bootstrap endpoint** (tenant + platform surfaces)

- **What**: return the authenticated identity plus everything the SPA needs at
  boot: roles, permissions, features, tenant + branding, terminology, tenants[]
  the user belongs to, and (once Organization exists) accessible scopes.
- **Why**: the login DTO is intentionally minimal; the SPA needs to build its
  nav/RBAC/labeling on boot without a dozen extra requests.
- **Suggested shape** — tenant surface:

```jsonc
{
  "data": {
    "user": { "id","name","email","email_verified_at","status","last_login_at" },
    "profile": { "first_name","last_name","display_name","avatar_url","phone","locale","timezone" },
    "roles": ["owner","admin", ...],
    "permissions": ["athletes.viewAny", ...],           // resolved via spatie
    "features": ["athletes","teams", ...],              // pennant-resolved for this tenant
    "terminology": { "athlete": "Student", ... },       // business_type + tenant overrides
    "tenant": { "id","slug","name","business_type","business_type_label",
                "branding": {"logo_url","primary_color","favicon_url"} },
    "tenants": [ /* other workspaces this user belongs to (across tenants) */ ],
    "scopes": {
      "organizations": [{ "id","name","is_default" }, ...],
      "branches":      [{ "id","name","organization_id","is_default" }, ...],
      "seasons":       [{ "id","name","status","is_current" }, ...]
    }
  }
}
```

- **Platform surface** — same shape but `tenant`/`tenants` are absent; add
  `is_platform_admin: true`.

**G2 — Seed Access permissions + roles** (backend Access module)

- **What**: seed the `permissions` and `roles` tables with the canonical list,
  plus the `manage-tenants` ability. Assign per business‑type default role sets
  so `Tenant::status = active` provisions a working RBAC.
- **Permission strings** — the frontend already uses
  `{resource}.{viewAny|view|create|update|delete}` (see
  `accessControlProvider`). Backend should seed exactly this vocabulary.
- **Roles** — the eight base roles from `BusinessType::defaultRoles()`:
  `owner, admin, branch_manager, coach, athlete, parent_guardian, front_desk, viewer`
  (+ optional `medical`).
- **Assignment** — `owner` gets `*`; `admin` gets all
  `*.viewAny/*.view/*.create/*.update/*.delete` minus platform stuff; etc.

**G3 — `GET /api/v1/auth/workspaces` (cross‑tenant workspace list)** (central
surface)

- **What**: returns all tenants the current user belongs to (by email, or by
  user id). Powers the Slack‑style workspace picker.
- **Auth**: `auth:sanctum`, but callable on the central host with a valid token
  (need a small route in the central `Auth` router).
- **Shape**:
  `{ data: [{ id, slug, name, logo_url, role, last_active_at }, …] }`.

### 8.2 P1 — required for full self‑service

**G4 — "Find my workspaces" endpoint** (central, public)

- `POST /api/v1/auth/find-workspaces` — body `{ email }` — always 200, emails
  the user the list of workspaces they belong to.

**G5 — Self‑serve tenant creation** (central, public — throttled)

- `POST /api/v1/tenants/register` — body
  `{ workspace_name, slug, business_type, owner: { name, email, password } }` —
  creates the tenant + a default `Organization`/`Branch` + the initial owner
  user. Currently `POST /api/v1/tenants` is admin‑only.
- Backend needs to add:
  - Public route with heavy throttling + email verification.
  - Default org/branch provisioning inside `ProvisionTenant` action.
  - Reserved slug list (e.g. `www, api, admin, mail`).

**G6 — Organization module** (Organization + Branch + Team + Season)

- Frontend has full CRUD mocks for all four. Backend must build them per the
  identity/tenancy spec §3.
- Endpoints (tenant surface):
  `GET|POST|PATCH|DELETE /api/v1/{organizations,branches,teams,seasons}[/{id}]`.
- Each returns Foundation‑enveloped `{data, meta}`.
- The `/me` bootstrap (G1) surfaces the user's accessible scopes based on these.

### 8.3 P1 — headers + logging

**G7 — Client fingerprint headers** (Foundation middleware)

- Read `X-Client`, `X-Device-Id`, `X-Device-Name`, `X-Device-Platform`,
  `X-Device-Type`, `X-Timezone`, `X-Locale` on every authenticated request.
- Log them on `user_sessions` and `login_attempts`, expose on the impersonation
  trail.
- No behavior change; purely observability.

**G8 — `user_sessions` table + `LoginAttempt` recorder**

- The identity spec calls for these; not present in migrations today.
- On login, insert a `user_sessions` row keyed by the issued token id +
  `X-Device-*` headers.
- On any 401, revoke the session and remove the row.

### 8.4 P2 — nice to have (deferred)

**G9 — Enable tenant 2FA**

- Add `Laravel\Fortify\TwoFactorAuthenticatable` trait to
  `App\User\Models\User` + migration for the 3 encrypted columns.
- Remove the `501` stubs on `/api/auth/two-factor/*`.

**G10 — `GET /api/v1/features`** (tenant surface, SPA readable)

- Returns the resolved feature‑flag map for the current tenant + user. Currently
  only the platform admin endpoint exists.

**G11 — Wildcard CORS origin**

- Configure `allowed_origins_patterns` (via Laravel package or manual patch) to
  accept `https://*.stackra.app` — otherwise each custom‑domain tenant needs
  an explicit CORS entry.

**G12 — `X-Api-Version`** in `exposed_headers`.

---

## 9. Auth flows — deep detail

### 9.1 Sign in — tenant

```
User at {slug}.stackra.app/login enters email + password
  ↓
Frontend POST /api/auth/login  { email, password, device_name: "Chrome on macOS 15.0" }
  ↓ 200
  { access_token, token_type: "Bearer", abilities, risk_score, user, expires_at: null, ... }
  ↓
Store token; call GET /api/auth/me (backend gap G1)
  ↓
Hydrate Identity + apply terminology + start Refine
  ↓
Redirect to /dashboard
```

Failure modes:

- 422 → validation errors on the form.
- 401 → generic "Invalid credentials".
- 403 with `account_not_accessible` → "Your account is disabled" screen.
- 423 → lockout screen with `Retry-After` countdown.
- 429 → "Too many attempts, try again in X seconds".
- 200 with `two_factor_required: true` and `challenge_token` → redirect to
  `/2fa/challenge?token=…` (currently only reachable on platform surface).

### 9.2 Register — tenant

```
POST /api/auth/register  { name, email, password, password_confirmation }
  ↓ 201
  { data: UserData }
  ↓
Redirect to /login?flash=please-check-your-email
```

Note: **no auto‑login**; user must sign in. Email verification is triggered by
the register action.

### 9.3 Forgot password — tenant

```
POST /api/auth/forgot-password { email }
  ↓ 200 always
Show "If an account exists with that email, we sent instructions."
```

Email contains a link to `{slug}.stackra.app/reset-password?token=…&email=…`.

### 9.4 Reset password — tenant

```
User lands with token + email in URL params
POST /api/auth/reset-password { token, email, password, password_confirmation }
  ↓ 200 { message: "Password reset." }
  ↓
All tokens revoked. Redirect to /login.
```

### 9.5 Email verify — tenant

- Verification email link:
  `{slug}.stackra.app/api/auth/email/verify/{id}/{hash}?signature=…`
- Backend serves the endpoint directly (no frontend interception); the frontend
  handles the redirect target via a public `/verify-email` route that reads the
  query params, hits the backend, then routes on the response.
- Resend: authenticated `POST /api/auth/email/verification-notification`.

### 9.6 2FA (platform only for now)

- Enrolment: after first platform login, response has
  `two_factor_setup_required: true` and an ability list of
  `["two_factor_enable"]`. UI: redirect to `/2fa/setup`, call
  `POST /two-factor/enable`, render the QR + secret. On code confirm,
  `POST /two-factor/confirm` returns a full‑ability token + recovery codes;
  store them.
- Challenge on subsequent logins: login returns
  `two_factor_required + challenge_token`. UI: `/2fa/challenge?token=…`, submit
  `POST /two-factor/challenge {challenge_token, code}` or
  `{challenge_token, recovery_code}`.
- Recovery codes management: `GET/POST /two-factor/recovery-codes` behind
  `password.confirm`.
- Disable: **always fails** — hide the button on platform surface.

### 9.7 Impersonation (platform → tenant)

```
Platform admin opens /admin/tenants/{tenantId}/users/{userId}
  ↓ Click "Impersonate"
Password step-up modal → POST /confirm-password
  ↓
POST /api/v1/platform/auth/impersonate { tenant_id, tenant_user_id, ttl_minutes: 15 }
  ↓ 200 { access_token, expires_at, user }
  ↓
Open new tab at {slug}.stackra.app with the impersonation token in a URL fragment (or handshake)
  ↓ Tenant SPA reads the token, stores it, calls /me, renders impersonation banner
  ↓
Stop → POST /api/v1/platform/auth/impersonate/stop  (uses the tenant-side token)
  ↓ Revokes the impersonation token; tenant SPA logs out
```

---

## 10. Phased execution plan

Each phase ends with green gates (tsc 0, eslint 0, knip 0, tests, build, size)
and a conventional commit.

### Phase 1 — HTTP client + tenancy library (frontend only, no backend deps)

- Build `src/lib/http/*` (Axios upgrades, device headers, envelope handling,
  refresh flow).
- Build `src/lib/tenancy/*` (workspace context, subdomain resolution, workspace
  picker component).
- Update `src/config/env.ts` and add the runtime host detection.
- **Backend deps**: none (uses fixtures).

### Phase 2 — Split auth providers + all auth pages

- Rewrite `src/providers/auth/*` into `tenant` + `platform` + `mock` variants.
- Build
  `/login, /register, /forgot-password, /reset-password, /verify-email, /verify-email-notice, /2fa/challenge, /2fa/setup, /confirm-password, /change-password`
  and the platform‑only `/impersonate` UX.
- Wire the mock provider to return the real `AuthTokenData` shape so end‑to‑end
  flows work against fixtures.
- **Backend deps**: none for the tenant flows (backend already implements them).
  Platform 2FA needs real backend to test the full 501‑free path but the UI can
  be built against the DTOs.

### Phase 3 — Multi‑provider setup + first live resources

- Wire `<Refine dataProvider={{ default: rest, mock }} />` per §4.5.
- Flip `tenants` (platform admin CRUD) and `features` (once G10 lands) to
  `default`.
- Add `/me` fetch after login (fall back to fixtures until backend gap G1
  lands).
- Rewrite `demo-users.json` + add `login.json` fixtures to match the real DTOs
  byte‑for‑byte.
- Update `map-identity.ts` + `session.ts` to consume the real shape.
- **Backend deps**: `Tenant` API is ready; G1 (`/me`) unblocks identity
  bootstrap end‑to‑end.

### Phase 4 — Workspace picker + tenant switching

- Central‑host routes (`/`, `/create-workspace`, `/forgot-workspace`).
- `WorkspaceSwitcher` uses `useMyWorkspaces()` (backed by fixtures → G3 endpoint
  when available).
- Full‑navigation `switchWorkspace(slug)`.
- **Backend deps**: G3 (list workspaces) + optionally G4/G5 for full self‑serve.

### Phase 5 — RBAC + terminology from real backend

- Once G1 + G2 land, remove fixture roles/permissions/features/terminology and
  drive everything from the backend response.
- Tighten the `accessControlProvider` to short‑circuit on
  `permissions.includes("*")` (already does), otherwise check exact matches.
- **Backend deps**: G1 + G2.

### Phase 6 — Backend header ingestion + session logging

- Add the device headers to every request (already done in phase 1) — nothing to
  change on the frontend.
- **Backend deps**: G7 + G8 (Foundation middleware + `user_sessions` table).

### Phase 7 — Tenant 2FA (unblock when backend enables it)

- Remove the "coming soon" copy on the tenant `/2fa/*` pages, wire them like the
  platform surface.
- **Backend deps**: G9.

### Phase 8 — Organization/Branch/Team/Season (real backend)

- Flip each of `organizations`, `branches`, `teams`, `seasons` from `mock` to
  `default` in its `*.module.tsx` as backend endpoints land — no other code
  change required (see §4.5 migration recipe).
- `scope.types.ts` unchanged; `scope-context.tsx` fetches from real endpoints
  instead of `me.json`.
- **Backend deps**: G6.

### Phase 9 — Everything else (domain modules, incremental)

- One PR per backend module as it ships. Each PR flips exactly one resource's
  `meta.dataProviderName` from `"mock"` to `"default"` (or removes the meta),
  deletes its fixture, and smoke‑tests against staging.
- Order suggested by domain dependency: Athlete → Team member → Season →
  Registration → Event → Match/Training/Session → Attendance → Progress →
  Payments/Invoices → Membership → the rest.

---

## 11. Open decisions (frontend/backend joint)

1. **Custom domains** — do we set them up server‑side (backend adds a `Domain`
   row) or do tenants add their own via a DNS validation flow? Affects Phase 4.
2. **Central admin subdomain** — `admin.stackra.app` vs
   `stackra.app/admin`? Recommendation: use a subdomain so `platform.domain`
   middleware unambiguously matches; the central host `stackra.app` is
   workspace picker + marketing only.
3. **Multi‑workspace session** — do we share the auth token across tenant
   subdomains (impossible cross‑subdomain with `localStorage`) or force login
   per workspace? Recommendation: **force login per workspace** (simpler, more
   secure); the workspace picker only lists workspaces after collecting the
   email + a challenge.
4. **Impersonation handoff** — URL fragment vs a POST‑back handshake?
   Recommendation: **fragment** (`#imp_token=…`) which the tenant SPA reads on
   `hashchange` and clears from the URL; the impersonation token is short‑lived
   (TTL ≤ 15 min).
5. **Custom‑domain CORS** — do we maintain an allow‑list of custom domains or
   add a pattern matcher? Recommendation: pattern matcher via
   `allowed_origins_patterns` regex.
6. **Password policy source** — currently the frontend has no policy; the
   backend enforces min 12 + letters + digits + uncompromised. Ship a
   `password-policy.ts` mirror on the frontend that displays live rule ticks;
   keep it in sync via a `GET /api/v1/config/password-policy` (**gap G13** —
   trivial).

---

## 12. Deliverables checklist

Frontend

- [ ] `src/lib/http/*` — upgraded Axios instance (§4.1)
- [ ] `src/lib/tenancy/*` — new library (§4.2)
- [ ] `src/providers/auth/*` — split tenant/platform (§4.4)
- [ ] `src/providers/data/*` — multi‑provider map (`default` REST + `mock`) with
      per‑resource `meta.dataProviderName` (§4.5)
- [ ] Migrate `tenants` + `features` resources from `mock` → `default` (§4.5)
- [ ] `src/modules/auth/pages/*` — all 10+ auth pages (§5)
- [ ] `src/modules/workspace/*` — Slack picker + self‑serve (§5.1)
- [ ] `apps/web/public/data/demo-users.json` — aligned to real DTO (§7.1)
- [ ] `apps/web/public/data/me.json` — reshape to bootstrap response (§7.2)
- [ ] `apps/web/public/data/login.json` — new, mirrors `AuthTokenData` (§7.1)
- [ ] `src/config/env.ts` — central + admin + api path (§4.6)

Backend (documented gaps)

- [ ] G0 — CORS origins env + exposed headers
- [ ] G1 — `/me` bootstrap endpoint (tenant + platform)
- [ ] G2 — seed permissions + roles + `manage-tenants` ability
- [ ] G3 — `GET /api/v1/auth/workspaces`
- [ ] G4 — `POST /api/v1/auth/find-workspaces`
- [ ] G5 — public self‑serve tenant creation
- [ ] G6 — Organization + Branch + Team + Season modules
- [ ] G7 — device fingerprint middleware
- [ ] G8 — `user_sessions` table + recorder
- [ ] G9 — tenant 2FA (Fortify trait + migration)
- [ ] G10 — `GET /api/v1/features` for the SPA
- [ ] G11 — wildcard CORS origin patterns
- [ ] G12 — `X-Api-Version` in exposed headers
- [ ] G13 — `GET /api/v1/config/password-policy`

---

## 13. References

- **Backend spec**: `.ref/docs/IDENTITY_AND_TENANCY_SPEC.md` (identity + tenancy
  blueprint, agreed).
- **Backend blueprint**: `.ref/docs/DOMAIN_MODULES_BLUEPRINT.md` (full domain
  module list).
- **Backend Postman collection**:
  `docs/postman/Stackra.postman_collection.json` (current endpoints).
- **Frontend spec**:
  `.kiro/specs/frontend-domain-rebuild/{requirements,design,tasks}.md`.
- **Frontend steering**: `.kiro/steering/frontend-module-architecture.md`.
