# Academorix — Auth / User / Tenant API contract

The definitive list of what the backend must return + support to align with the
frontend. Grounded in a direct scan of `apps/web/src/**` (what the SPA actually
reads) and `modules/**` (what the backend currently exposes) on **2026-07-05**.

Structured so the backend team can implement each endpoint independently. Every
shape below is snake_case at the JSON boundary, wrapped in the Foundation
envelope (`{ message, status, data, meta? }`) **unless it is an auth-flow
endpoint** (auth endpoints intentionally return the DTO at the root — see
`Auth.LoginController` for precedent).

---

## 1. Executive summary — what the frontend consumes

- **On sign-in**: a minimal user + Sanctum token (`AuthTokenData` — already
  implemented).
- **On boot after sign-in**: **one bootstrap call** to `GET /api/auth/me` that
  returns _everything_ the shell needs to render (nav, RBAC, terminology,
  workspace context, subscription banner, feature flags). Anything not in the
  bootstrap causes an extra round-trip on every page.
- **On demand only**: heavier lists (workspaces the user can access, per-license
  usage detail, invoices, catalog). These live behind their own endpoints.

**Design rule of thumb**: if the shell needs it on every screen → `/me`. If a
page needs it → its own endpoint.

---

## 2. Where each concern lives (recommendation)

| Concern                                                         | Where                       | Why                                                                                                                                                                                         |
| --------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity (id, email, profile)                                   | `/me`                       | Every page reads the current user.                                                                                                                                                          |
| Roles + permissions                                             | `/me`                       | Drives `<CanAccess>` and the sidebar filter on every render.                                                                                                                                |
| Feature toggles (booleans)                                      | `/me`                       | Same — a small set that gates nav items.                                                                                                                                                    |
| Terminology overrides                                           | `/me`                       | Same — the shell relabels resources at render time.                                                                                                                                         |
| Active tenant summary + branding                                | `/me`                       | Shell chrome (name, logo, colors).                                                                                                                                                          |
| Accessible scopes (organizations, branches, seasons)            | `/me`                       | Drives the scope switchers on every page.                                                                                                                                                   |
| **Subscription summary (plan, status, dates)**                  | `/me`                       | Shell renders a "Trial ends in 3 days" banner globally. Small; ~10 fields. Backend already anticipates this: `SubscriptionSummaryData` docblock says "the `/auth/me` manifest embeds this". |
| **Quota headlines** (used / limit for the 3-5 top entitlements) | `/me`                       | So list pages can render "You're at 95/100 athletes" without a second call.                                                                                                                 |
| Full entitlement matrix (every license + strategy + expiry)     | `GET /v1/entitlements`      | Big, only the billing/admin page needs it.                                                                                                                                                  |
| Workspaces the user belongs to                                  | `GET /v1/auth/workspaces`   | Big, only the Slack picker needs it.                                                                                                                                                        |
| Invoices                                                        | `GET /api/billing/invoices` | Big, only the billing page needs it. Already implemented.                                                                                                                                   |
| Plan catalog                                                    | `GET /api/billing/catalog`  | Public, only pricing pages. Already implemented.                                                                                                                                            |
| Provider portal deep link                                       | `GET /api/billing/portal`   | On demand, admin only. Already implemented.                                                                                                                                                 |

**Bottom line**: subscription **summary** and **quota headlines** belong in
`/me`. **Everything deeper** (invoices, per-license usage, catalog) is its own
endpoint. This is the Slack/Linear/Vercel pattern — one big bootstrap plus small
purposeful sub-calls.

---

## 3. The `/me` bootstrap contract (backend gap G1)

**Endpoint**: `GET /api/auth/me` **Auth**: `auth:sanctum` + `tenant.user`
(tenant surface). Platform surface has its own variant at
`/api/v1/platform/auth/me` returning `is_platform_admin: true` and NO
tenant/scopes. **Envelope**: Foundation `{ data: {...} }`. **Cache**: response
bag is small (a few KB); safe to `Cache-Control: private, max-age=60`.

### 3.1 Complete response shape

```jsonc
{
  "data": {
    // ─── Identity ────────────────────────────────────────────────────
    "user": {
      "id": "01h8xkq4-…-alexrivera", // UUID
      "email": "alex@riverside.test",
      "email_verified_at": "2025-09-01T10:00:00Z",
      "phone": null,
      "phone_verified_at": null,
      "status": "active", // pending|active|disabled
      "last_login_at": "2026-06-30T08:15:00Z",
      "created_at": "2025-09-01T10:00:00Z",
    },

    // ─── Profile (PII satellite) ────────────────────────────────────
    "profile": {
      "first_name": "Alex",
      "last_name": "Rivera",
      "display_name": "Alex Rivera",
      "avatar_url": null,
      "locale": "en", // BCP-47
      "timezone": "America/New_York", // IANA
    },

    // ─── Authorization (data-driven, no hardcoded roles anywhere) ───
    "roles": ["owner"], // raw role keys
    "permissions": ["*"], // "*" = superuser
    "features": [
      // enabled feature keys
      "athletes",
      "teams",
      "scheduling",
      "attendance",
      "competition",
      "progress",
    ],
    "terminology": {
      // resource label overrides
      "athletes": "Students",
      "teams": "Classes",
    },

    // ─── Current workspace (tenant summary) ─────────────────────────
    "tenant": {
      "id": "01h8-riverside-…",
      "slug": "riverside",
      "name": "Riverside Sports Academy",
      "business_type": "academy", // BusinessType enum
      "business_type_label": "Academy",
      "status": "active", // trialing|active|suspended|inactive
      "status_label": "Active",
      "branding": {
        "logo_url": null,
        "primary_color": null,
        "favicon_url": null,
      },
    },

    // ─── Cross-workspace list (for the in-shell switcher) ───────────
    // Optional here — a separate GET /v1/auth/workspaces covers the
    // Slack picker on the central host with richer per-workspace data.
    // Include just the summary on /me so the in-shell dropdown works
    // without a second call.
    "tenants": [
      {
        "id": "…",
        "slug": "riverside",
        "name": "Riverside Sports Academy",
        "business_type": "academy",
      },
      {
        "id": "…",
        "slug": "harbor",
        "name": "Harbor Aquatics",
        "business_type": "sports_center",
      },
    ],

    // ─── Scope: what the caller can work in ─────────────────────────
    // Filtered by RBAC server-side, so client code cannot pick a scope
    // they don't have access to.
    "scopes": {
      "organizations": [
        {
          "id": "org_riverside",
          "name": "Riverside (Main)",
          "is_default": true,
        },
      ],
      "branches": [
        {
          "id": "brn_river",
          "name": "Riverside HQ",
          "organization_id": "org_riverside",
          "region_id": "reg_us_east",
          "is_default": true,
        },
      ],
      "seasons": [
        {
          "id": "ssn_2025_26",
          "name": "2025/26",
          "status": "active",
          "is_current": true,
        },
      ],
    },

    // ─── Subscription summary (RECOMMENDATION: embed here) ──────────
    // Powers global banners: "Trial ends in 3 days", "Grace ends
    // tomorrow", "Reactivate your subscription". Small and read on
    // every page; embedding avoids a per-page /billing/status call.
    // Backend already docblocks SubscriptionSummaryData as intended
    // for this bootstrap.
    "subscription": {
      "plan_key": "growth", // starter|growth|pro|enterprise
      "plan_label": "Growth",
      "status": "trialing", // trialing|active|past_due|grace|suspended|paused|canceled
      "status_label": "Trial",
      "entitlements_active": true,
      "billing_period": "monthly", // monthly|yearly
      "currency": "USD",
      "trial_ends_at": "2026-07-15T00:00:00Z", // null if not on trial
      "current_period_ends_at": "2026-08-01T00:00:00Z",
      "grace_ends_at": null,
      "canceled_at": null,
    },

    // ─── Quota headlines (RECOMMENDATION: embed here) ──────────────
    // The 3-5 quotas users hit constantly. Enough for banners + list
    // "you're at 95/100" hints; a dedicated /v1/entitlements has the
    // full matrix. Absent when the tenant has no plan yet.
    "quota_summary": [
      { "key": "athletes.max", "used": 87, "limit": 100 },
      { "key": "branches.max", "used": 2, "limit": 5 },
      { "key": "storage_gb.max", "used": 12, "limit": 50 },
    ],
  },
}
```

### 3.2 Platform admin variant

`GET /api/v1/platform/auth/me` on the central admin host — same envelope,
different body:

```jsonc
{
  "data": {
    "user": { "id": 42, "email": "admin@academorix.staff", … },
    "profile": { "first_name": "Dana", "last_name": "Whitfield", … },
    "roles": ["super_admin"],
    "permissions": ["*"],
    "is_platform_admin": true,
    "two_factor_confirmed_at": "2026-06-01T00:00:00Z"
    // NO `tenant`, `tenants`, `scopes`, `subscription`, `quota_summary`
  }
}
```

### 3.3 Endpoint mechanics

- **Cacheable**: yes — private, ~60s. Add `Cache-Control: private, max-age=60` +
  `ETag` so a full-page reload can validate cheaply.
- **Invalidation triggers** (backend fires events; frontend just refetches on
  relevant screens):
  - `SubscriptionActivated`, `SubscriptionSuspended`, `PlanChanged` → refetch
    subscription block.
  - `RolesChanged` on user → refetch permissions/roles.
  - Tenant `settings.terminology` update → refetch terminology.
  - License grant/revoke → refetch quota_summary.
- **Failure modes**: 401 (token expired) → normal refresh flow; 403 (account
  disabled) → force logout with reason.

---

## 4. The auth surface — deltas the frontend needs

The tenant + platform auth surfaces are largely built. Gaps and refinements
below.

### 4.1 Login response (`POST /api/auth/login`)

Already returns `AuthTokenData`. **No changes needed** — the frontend
`AuthTokenResponse` type mirrors this byte-for-byte. Fields consumed:

- `access_token`, `token_type`, `abilities`, `risk_score`, `expires_at`
- `user.{id, name, email, email_verified_at, status, last_login_at}`
- `two_factor_setup_required` (platform pre-enrolment path)
- `two_factor_required` + `challenge_token` (post-login 2FA branch)

### 4.2 Two-factor-required response shape

Match `TwoFactorRequiredData` exactly. Frontend has a `isTwoFactorRequired()`
discriminator that keys off `two_factor_required === true`.

```jsonc
{
  "two_factor_required": true,
  "challenge_token": "opaque-jwt-or-random",
  "challenge_url": "/api/v1/platform/auth/two-factor/challenge",
  "challenge_expires_in": 300, // seconds
}
```

### 4.3 Tenant 2FA — currently 501 (backend gap G9)

Frontend has the pages built and gated behind a "coming soon" hint. When the
tenant `User` gains `Laravel\Fortify\TwoFactorAuthenticatable`, the tenant
`POST /api/auth/two-factor/*` endpoints should return the same shapes the
platform surface returns today:

- `enable` → `{ qr_code_svg, secret }` (`TwoFactorEnableResponse`)
- `confirm` → `AuthTokenData` (fresh full-abilities token)
- `challenge` → `AuthTokenData`
- `recovery-codes` GET / POST → `{ recovery_codes: string[] }`

No frontend changes needed — the pages already call these.

### 4.4 Password + email flows

All implemented. Frontend consumes:

- `POST /auth/forgot-password` → `{ message }` (always 200)
- `POST /auth/reset-password` → `{ message }`, then frontend clears local token
- `POST /auth/confirm-password` → `{ confirmed: true }`
- `POST /auth/change-password` → `{ message }`
- `GET /auth/email/verify` → `{ verified: bool, email: string }` ← **verify this
  is the exact shape**
- `POST /auth/email/verification-notification` → `{ message }`

### 4.5 Impersonation — implemented, but frontend needs a stop callback

- `POST /v1/platform/auth/impersonate` → `AuthTokenData` for the target tenant
  user. Frontend needs the response to include enough context to render the
  banner: **add** `impersonator: { id, name, email }` to the response so the SPA
  can label the banner correctly without a second `/me` on the source side.
  Suggested:

```jsonc
{
  "access_token": "…",
  "token_type": "Bearer",
  "abilities": ["…scoped by policy"],
  "risk_score": 0,
  "expires_at": "2026-07-05T09:15:00Z",   // MUST be non-null for impersonation
  "user": { …target tenant user… },
  "impersonator": {
    "id": 42,
    "name": "Dana Whitfield",
    "email": "admin@academorix.staff"
  }
}
```

- `POST /v1/platform/auth/impersonate/stop` → uses the tenant-side token;
  revokes it. Return `{ message }`.

---

## 5. User CRUD — what's missing

**Status today**: `User` module has models + Fortify actions + DTOs, but **no
HTTP controllers or routes**. Frontend expects a full CRUD to power the `users`
resource:

- `GET /api/v1/users` — paginated `{ data: User[], meta: {…} }` —
  spatie/query-builder filters (`filter[email]=…`, `filter[status]=active`,
  `sort=-created_at`).
- `GET /api/v1/users/{id}` — `{ data: User }` (with `profile` embedded).
- `POST /api/v1/users` — accepts
  `{ email, password, profile: { first_name, last_name, …}, roles?: string[] }`,
  returns `{ data: User }`.
- `PUT /api/v1/users/{id}` — partial update; roles updated separately if needed.
- `DELETE /api/v1/users/{id}` — soft delete; returns 204.
- `POST /api/v1/users/{id}/roles` — replace role set; returns updated user.

**Profile fields the frontend uses** (currently not on `users` table):
`first_name`, `last_name`, `avatar_url`, `phone`, `locale`, `timezone`. The
identity spec proposes a `profiles` satellite table — build it or fold these
onto `users` directly, but the wire shape MUST include them (see §3.1 above).

---

## 6. Workspace endpoints (Slack picker)

Two endpoints — the frontend already calls both and gracefully falls back to
fixtures when missing.

### 6.1 `GET /api/v1/auth/workspaces` (gap G3)

**Auth**: `auth:sanctum` — any valid token, including a token minted for another
workspace. The endpoint filters by the caller's `email` (not `tenant_id`) so
users see every workspace they belong to.

```jsonc
{
  "data": [
    {
      "id": "…",
      "slug": "riverside",
      "name": "Riverside Sports Academy",
      "logo_url": null,
      "role": "Owner",
      "last_active_at": "2026-06-30T08:15:00Z",
    },
    {
      "id": "…",
      "slug": "harbor",
      "name": "Harbor Aquatics",
      "logo_url": null,
      "role": "Admin",
      "last_active_at": "2026-06-20T14:30:00Z",
    },
  ],
}
```

### 6.2 `POST /api/v1/auth/find-workspaces` (gap G4)

**Auth**: public. Body `{ email }` → always 200; emails the user their workspace
list (anti-enumeration).

### 6.3 `POST /api/v1/tenants/register` (gap G5) — self-serve creation

**Auth**: public, heavy throttling.

```jsonc
// Request
{
  "workspace_name": "Riverside Sports Academy",
  "slug": "riverside",
  "business_type": "academy",
  "owner": {
    "name": "Alex Rivera",
    "email": "alex@riverside.test",
    "password": "…",
    "password_confirmation": "…"
  }
}
// Response 201
{ "data": { "tenant": TenantData, "owner": UserData } }
```

Backend must also:

- Reserve a subdomain slug list (`www`, `api`, `admin`, `mail`, `blog`, …).
- Provision default `Organization` + `Branch` inside the `ProvisionTenant`
  action.
- Send email verification for the new owner.

---

## 7. Subscription — what the frontend already expects to see

Backend has all endpoints under `/api/billing/*`. The frontend needs:

- **Global banner data** — comes from `subscription` inside `/me` (§3.1). **Do
  this** rather than requiring the SPA to call `/billing/status` on every page.
- **Billing settings page** — `GET /api/billing/status` returning
  `SubscriptionSummaryData` (already implemented). Same shape as the `/me`
  embed.
- **Plan management** — `POST /billing/change-plan`, `pause`, `resume`, `cancel`
  (all implemented). Returns `SwapResultData` or `SubscriptionSummaryData`. The
  frontend refetches `/me` after these to update the banner.
- **Invoices page** — `GET /api/billing/invoices` returns `InvoiceData[]` under
  `{ data, meta }`. Already implemented.
- **Provider portal** — `GET /api/billing/portal` returns `{ portal_url }`.
  Frontend navigates to it. Already implemented.
- **Public catalog** — `GET /api/billing/catalog` returns `PlanTierData[]`. Used
  on marketing pages.

**Frontend consumer today**: `modules/billing/` (subscription view — stub). Wave
7 will hook it up to the real endpoints; nothing to change on the backend beyond
adding the `SubscriptionSummaryData` embed in `/me`.

---

## 8. Entitlements — full endpoint (gap: needs HTTP surface)

Backend Entitlements module has models but no controllers/routes yet. Frontend
needs:

### 8.1 `GET /api/v1/entitlements`

**Auth**: `auth:sanctum` + `tenant`, `view_billing` permission.

```jsonc
{
  "data": {
    "licenses": [
      {
        "id": 123,
        "key": "athletes.max",
        "type": "slot", // slot|pool|feature
        "grant": {
          "kind": "unlimited", // unlimited|integer|boolean
          // OR: "kind": "integer", "limit": 100
          // OR: "kind": "boolean", "enabled": true
        },
        "usage": {
          "used": 87,
          "remaining": 13, // null when kind=unlimited
          "as_of": "2026-07-05T09:00:00Z",
        },
        "period": {
          "starts_at": "2026-07-01T00:00:00Z",
          "ends_at": "2026-08-01T00:00:00Z",
        },
      },
      // …
    ],
  },
}
```

Frontend uses this to render the full matrix on the billing/quota page. Small
enough to fetch on that page's mount; not needed in `/me`.

---

## 9. FeatureFlag — SPA-readable endpoint (gap G10)

Backend has `GET /api/v1/tenants/{tenant}/features` and
`PUT /api/v1/tenants/{tenant}/features/{feature}` — **platform admin only**.

Frontend needs a **tenant-side** read endpoint so a tenant admin can see the
effective feature list without going through the platform surface:

- `GET /api/v1/features` — tenant surface, returns the resolved feature map for
  the current tenant.

```jsonc
{
  "data": [
    { "feature": "athletes", "enabled": true, "source": "business_type" },
    { "feature": "competition", "enabled": true, "source": "override" },
    { "feature": "multi_sport", "enabled": false, "source": "business_type" },
  ],
}
```

Note: the _booleans_ also live under `/me.features` for shell-level nav
filtering. This endpoint is the detailed view (with `source`) for a settings
page.

---

## 10. Cross-cutting things the frontend needs

### 10.1 CORS (gap G0 + G11 + G12)

Set `CORS_ALLOWED_ORIGINS` env to include:

- `https://academorix.app`
- `https://*.academorix.app` (wildcard — use `allowed_origins_patterns` since
  Laravel's `allowed_origins` doesn't support wildcards)
- `https://academorix.vercel.app` (current prod frontend)
- `http://localhost:3000`, `http://127.0.0.1:3000` (dev)

Add to `config/cors.php`:

```php
'exposed_headers' => ['X-Api-Version', 'Retry-After', 'Deprecation', 'Sunset'],
```

### 10.2 Device fingerprint (gap G7)

Foundation middleware reads and logs (does not require) on every authenticated
request:

- `X-Client` — SPA version string (e.g. `academorix-web/2.4.1`)
- `X-Device-Id` — stable UUID per browser install
- `X-Device-Name` — human-readable ("Chrome on macOS 15.0")
- `X-Device-Platform`, `X-Device-Type` (`desktop|mobile|tablet`)
- `X-Timezone` (IANA), `X-Locale` (BCP-47)

Frontend already sends these. Backend just needs to read + optionally persist
them on `user_sessions` / `login_attempts`.

### 10.3 Session recording (gap G8)

`user_sessions` table (identity spec proposes it). On login:

- Row with `user_id`, `token_id` (Sanctum PAT id), `device_fingerprint` (JSON of
  headers), `ip`, `user_agent`, `last_active_at`, `expires_at`.
- Kill switch: DELETE endpoint the user can call from a "sessions & devices"
  page to revoke another device.

Frontend UI is a future addition; the backend structure is what unblocks it.

### 10.4 API versioning header

- `X-Api-Version: 1.0` from the SPA → backend `api.version` middleware reads it.
- Backend echoes it in the response so the SPA can detect deprecation.
- On deprecated versions, add `Deprecation: true` + `Sunset: <RFC 7231 date>`
  headers → SPA renders a banner.

---

## 11. Priority checklist for the backend team

**P0 — unblocks the frontend shell** (frontend is stalled on synth-identity
fallbacks until these ship)

1. **G1** — `GET /api/auth/me` with the full shape in §3.1 (identity + roles +
   permissions + features + terminology + tenant + tenants[] + scopes +
   subscription + quota_summary).
2. **G2** — Seed the permission catalog + default roles per business type.
   Include the `manage-tenants` ability so central admin endpoints stop 403'ing.
3. **G0** — Configure `CORS_ALLOWED_ORIGINS` for the production + preview + dev
   origins.

**P1 — unblocks workspace flow + tenant CRUD** (frontend has all the UI;
endpoints are what's missing) 4. **G3** — `GET /api/v1/auth/workspaces`
(cross-tenant list). 5. **G5** — `POST /api/v1/tenants/register` (self-serve
creation). 6. **G4** — `POST /api/v1/auth/find-workspaces`
(email-me-my-workspaces).

**P1 — unblocks the users page** (frontend has full CRUD screens against
fixtures) 7. **User HTTP controllers** — index / show / store / update /
destroy + `/{id}/roles`. Profile fields (`first_name`, `last_name`,
`avatar_url`, `phone`, `locale`, `timezone`) must land in the response.

**P1 — unblocks the domain** (frontend has 40+ modules waiting) 8. **G6** —
Organization / Branch / Team / Season modules with HTTP controllers. Each maps
to one `BACKEND_READY_RESOURCES` entry.

**P2 — polish** 9. **G7 + G8** — Device fingerprint middleware + `user_sessions`
recorder. 10. **G9** — Tenant 2FA (add `TwoFactorAuthenticatable` trait; remove
the 501 stubs). 11. **G10** — `GET /api/v1/features` (SPA-readable). 12.
**Impersonation `impersonator` field** on `AuthTokenData` (§4.5). 13. **G11 +
G12** — Wildcard CORS + `X-Api-Version` in `exposed_headers`. 14. **Entitlements
HTTP endpoint** (§8) — `GET /api/v1/entitlements`. 15. **G13** —
`GET /api/v1/config/password-policy` (defensive sync of the policy the frontend
already mirrors).

---

## 12. Frontend contract for the backend to know about

For each thing above, here's how the frontend is set up so the backend team
knows what "wired up" means on our side:

- **`/me` payload**: consumed by
  `providers/auth/map-identity.ts::toIdentity(authUser)`. The moment the
  endpoint returns the shape in §3.1, delete the
  `synthesizeIdentityFromMinimalUser` fallback branch.
- **Subscription banner**: `useTenancy()` will read `identity.subscription` (add
  to `Identity` type once the payload is stable) and render the banner from a
  single component in the shell. No component-level fetching.
- **Quota banners**: list pages read `identity.quota_summary` for their resource
  key (e.g. `athletes` reads `athletes.max`). Rendered by a shared
  `<QuotaBanner resource="athletes" />` component.
- **Workspaces**: `lib/tenancy/useMyWorkspaces()` calls
  `GET /v1/auth/workspaces`; graceful fallback to `/data/workspaces.json` when
  404 or in mock mode.
- **Multi-provider migration**: for each resource-with-a-backend-module, add the
  name to `BACKEND_READY_RESOURCES` in `providers/data/index.ts`. That's a
  one-line PR per resource.
- **Custom-domain tenants**: frontend calls `GET /api/current-tenant` on any
  tenant host; backend stancl middleware resolves the tenant from the request
  host (subdomain or custom `Domain` row).

---

## 13. Answer to the direct question — subscription in `/me`?

**Yes, embed the summary in `/me`. Split the rest.**

- **In `/me`** — `subscription: SubscriptionSummaryData` (10 fields: plan_key,
  plan_label, status, status_label, entitlements_active, billing_period,
  currency, trial_ends_at, current_period_ends_at, grace_ends_at, canceled_at).
  This is what the backend's `SubscriptionSummaryData` docblock already
  anticipates.
- **In `/me`** — `quota_summary: [{key, used, limit}]` for the 3-5 headline
  quotas (athletes.max, branches.max, storage_gb.max). One line per resource
  that has a limit-drawing UI.
- **Separate endpoint** `GET /v1/entitlements` — the full license matrix
  (per-license grant + strategy + usage window + expiry). Only the
  billing/quotas admin page needs it.
- **Separate endpoint** `GET /api/billing/status` — the same
  `SubscriptionSummaryData` refetched on demand from the billing page (already
  implemented).
- **Separate endpoints** — invoices, catalog, portal, plan changes (all
  implemented).

Why this split:

1. **One bootstrap for the whole shell**. Adding subscription summary + quota
   headlines costs ~15 fields on `/me`; the payload stays under 5 KB gzipped.
2. **Banners work everywhere**. The trial/grace/past-due banner appears on every
   page from a single `useTenancy()` read — no extra fetch, no flicker.
3. **Billing detail stays lazy**. Invoices, the full quota matrix, and the
   catalog are page-scoped fetches — they never touch the hot path.
4. **Cache invalidation is clean**. `/me`'s subscription block invalidates on
   `SubscriptionActivated` / `PlanChanged` / `SubscriptionSuspended` events
   (backend already fires these). No leaking cross-endpoint dependencies.
5. **Follows industry practice**. Slack, Linear, Vercel, Notion — every one
   embeds plan + trial state in the bootstrap and keeps invoices/catalog on
   their own endpoints.

The only decision left: are quota headlines expensive to compute? If yes (e.g.
requires COUNT queries on large tables), cache them for 60s and add them; if no,
they belong in `/me` unconditionally.
