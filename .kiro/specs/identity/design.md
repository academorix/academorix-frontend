# Identity — Design Specification

**Status:** Locked (D1-D3 confirmed). **Owner tier:** `modules/identity/`.
**Depends on:** `platform/application`, `platform/tenancy`, `access/rbac` (Wave
1b). **Consumed by:** every downstream module that authenticates or authorises.

## 1. Overview

The identity tier owns every principal that can authenticate against an
Stackra Application, plus the credentials and flows that make authentication
work. It is the **single root of trust** for every downstream service.

Six modules ship in Wave 1a:

| Module                       | Priority | Owns                                                                              |
| ---------------------------- | -------- | --------------------------------------------------------------------------------- |
| `identity/identity/`         | 15       | Global credential record (email + password + MFA + email verification + lockout)  |
| `identity/user/`             | 18       | Per-Application projection of an Identity, plus Profile + TenantMember            |
| `identity/platform-user/`    | 19       | Stackra staff principal (cross-tenant, cross-application)                      |
| `identity/mfa/`              | 20       | TOTP + WebAuthn + recovery codes (composed from auth)                             |
| `identity/service-accounts/` | 24       | Machine credentials for inter-service calls                                       |
| `identity/auth/`             | 25       | Login/refresh/logout, JWT signing + JWKS, session lifecycle, cross-app SSO grants |

Wave 1c (deferred to Enterprise Day 2): `identity/oauth/` (be an OAuth server),
`identity/sso/` (SAML + OIDC + SCIM as a consumer).

## 2. Locked design decisions

### D1 — Identity vs User split

**One `Identity` per real human, one `User` per (Identity × Application).**

- `Identity` holds the credential (email + password hash + MFA secret) — global,
  cross-Application.
- `User` holds the per-Application projection (tenant_id, status, profile_id,
  last_login_at) — one row per Application the human uses.
- A single human using Sports + Marketplace + Ticketing has ONE Identity row and
  THREE User rows.
- Cross-app SSO is grant-based: authenticate to Identity, receive time-limited
  grants for the specific Applications the caller opts into. Never
  credential-based.

`Identity` NEVER exposes User-scoped data. `User` NEVER stores credentials. This
is the security boundary — a breach of `users` doesn't expose passwords; a
breach of `identities` doesn't expose per-Application state.

### D2 — Tenants per Application

**`tenants.application_id` is required.** "Acme Corp on Sports" and "Acme Corp
on Marketplace" are **two distinct Tenant rows**. Tenants do not span
Applications.

Consequence for users: `users.application_id` + `users.tenant_id` compose the
scope. `UNIQUE(identity_id, application_id)` enforces "one User per Identity per
Application".

Multi-tenant membership within one Application (the workspace-switcher pattern)
is handled by the `tenant_members` pivot, not by having multiple User rows per
Application.

### D3 — JWT contract (HS256 for inter-service, JWKS for public verification)

**Identity-service signs every JWT. Every downstream service verifies locally.**

Two token classes:

1. **Sanctum PAT** (opaque bearer, per-request) — issued to Users and
   PlatformUsers on interactive login. Consumed only by the identity-service and
   by services co-hosted with it. Format is opaque; database-backed; revocable.

2. **Inter-service JWT** (HS256, signed by identity-service, verified locally by
   every service) — carries `sub` (user_id), `app` (application_id), `tid`
   (tenant_id), `sco` (scope claims), `roles`, `permissions[]`, `iat`, `exp`.
   The `app` claim binds the token to a single Application; downstream services
   reject `app` mismatches with 403.

**JWKS endpoint** — `/.well-known/jwks.json` on identity-service. Public keys
served with aggressive `Cache-Control: public, max-age=3600, immutable`. Key
rotation via `kid` header + overlapping keys during rotation window.

**Cross-app SSO grants** — when a User in Application A requests access to
Application B (both linked to the same Identity), identity-service issues a
short-lived grant token (300s TTL). The grant is presented to Application B's
auth endpoint which exchanges it for an Application B session.

## 3. Principal architecture — four principals, three guards

| Principal        | Table              | Guard              | Auth mechanism                                                                        |
| ---------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------- |
| `Identity`       | `identities`       | none               | Never authenticates directly                                                          |
| `User`           | `users`            | `sanctum`          | Sanctum PAT after Identity login; per-Application scope via `X-Application-Id` header |
| `PlatformUser`   | `platform_users`   | `platform_admin`   | Sanctum PAT, cross-application, cross-tenant                                          |
| `ServiceAccount` | `service_accounts` | bearer / HS256 JWT | Machine credential; no interactive login                                              |

**Guard boundary is inviolable.**

- A `sanctum` role never grants a `platform_admin` permission.
- A `platform_admin` role never grants a `sanctum` permission.
- Cross-guard writes to `roles` / `permissions` are rejected with
  `GuardMismatch` (422).

**Application boundary is inviolable.**

- A `User` on Application A never sees data on Application B.
- Even if their Identity has a User row on B, the two Users are independent.
- Cross-application writes to `roles` / `permissions` are rejected with
  `ApplicationMismatch` (422).

## 4. Data model — the six tables

### `identities` (owned by `identity/identity/`)

Global credential record. One row per real human.

| Column                                     | Type        | Notes                                                            |
| ------------------------------------------ | ----------- | ---------------------------------------------------------------- |
| `id`                                       | uuid        | prefixed `idn_`                                                  |
| `email`                                    | citext      | UNIQUE                                                           |
| `password_hash`                            | text        | bcrypt/argon2id                                                  |
| `mfa_secret_encrypted`                     | text        | encrypted at rest with KMS key                                   |
| `mfa_recovery_codes_hashed`                | jsonb       | array of bcrypt-hashed codes                                     |
| `email_verified_at`                        | timestamptz | nullable                                                         |
| `last_login_at`                            | timestamptz | nullable                                                         |
| `locked_until`                             | timestamptz | nullable — auto-lockout after `auth.lockout.max_failed_attempts` |
| `failed_attempts_count`                    | int         | reset on success                                                 |
| `dob`                                      | date        | for age-gate policy                                              |
| `created_at` / `updated_at` / `deleted_at` | timestamptz | soft-delete for GDPR erasure hold-period                         |

**Never carries** `application_id` (global) or `tenant_id` (global) or role info
(that lives on the User).

**Row-level enforcement:** the `identities` table has NO tenant scope; access is
auth-service-only. Never queried by domain modules.

### `users` (owned by `identity/user/`)

Per-Application projection of an Identity.

| Column             | Type        | Notes                                                        |
| ------------------ | ----------- | ------------------------------------------------------------ |
| `id`               | uuid        | prefixed `usr_`                                              |
| `identity_id`      | uuid        | FK identities.id, RESTRICT                                   |
| `application_id`   | uuid        | FK applications.id, RESTRICT                                 |
| `tenant_id`        | uuid        | FK tenants.id, CASCADE — home tenant                         |
| `profile_id`       | uuid        | FK profiles.id, RESTRICT — 1:1                               |
| `status`           | enum        | pending / active / suspended / disabled                      |
| `last_login_at`    | timestamptz | nullable                                                     |
| `default_role_id`  | uuid        | FK roles.id, nullable — first-seen role for new-user routing |
| `preferred_locale` | string(10)  | BCP-47, nullable — overrides tenant default                  |
| audit + timestamps |             |                                                              |

`UNIQUE(identity_id, application_id)` — one User per Identity per Application.

### `platform_users` (owned by `identity/platform-user/`)

Stackra-staff principal.

| Column             | Type   | Notes                                                           |
| ------------------ | ------ | --------------------------------------------------------------- |
| `id`               | uuid   | prefixed `plu_`                                                 |
| `identity_id`      | uuid   | FK identities.id, RESTRICT — reuses the same Identity substrate |
| `profile_id`       | uuid   | FK platform_profiles.id, RESTRICT                               |
| `status`           | enum   | pending / active / suspended                                    |
| `hire_date`        | date   | employment metadata                                             |
| `department`       | string | ops / product / engineering / support                           |
| audit + timestamps |        |                                                                 |

**Cross-tenant, cross-application by definition.** No `tenant_id`, no
`application_id`. Access controlled by the `platform_admin` guard exclusively.

### `service_accounts` (owned by `identity/service-accounts/`)

Machine credential for inter-service calls.

| Column              | Type        | Notes                                                   |
| ------------------- | ----------- | ------------------------------------------------------- |
| `id`                | uuid        | prefixed `svc_`                                         |
| `application_id`    | uuid        | FK applications.id, RESTRICT — binds account to one App |
| `tenant_id`         | uuid        | FK tenants.id, nullable — null = platform service       |
| `name`              | string      | human-readable identifier                               |
| `description`       | text        | operator-facing purpose                                 |
| `is_enabled`        | bool        | soft-disable                                            |
| `signer_kid`        | string      | kid for JWTs issued on behalf of this SA                |
| `secret_hash`       | text        | bcrypt-hashed rotation secret                           |
| `secret_rotated_at` | timestamptz | last rotation                                           |
| `expires_at`        | timestamptz | nullable — mandatory rotation deadline                  |
| audit + timestamps  |             |                                                         |

Owns HS256 signing capability for the inter-service JWT contract.

### `profiles` (owned by `identity/user/`)

1:1 PII satellite for User. Split from `users` for backup + audit isolation.

| Column             | Type       | Notes                                                  |
| ------------------ | ---------- | ------------------------------------------------------ |
| `id`               | uuid       | prefixed `prf_`                                        |
| `first_name`       | string     | required for adult principals                          |
| `last_name`        | string     | required for adult principals                          |
| `display_name`     | string     | UI-facing, nullable                                    |
| `avatar_url`       | string     | nullable                                               |
| `phone_e164`       | string     | E.164 format, nullable                                 |
| `locale`           | string(10) | BCP-47, nullable — user-preferred override             |
| `timezone`         | string     | IANA timezone                                          |
| `dob`              | date       | duplicated from `identities.dob` for query performance |
| audit + timestamps |            |                                                        |

**PII cluster.** Redactor rules always apply to profile columns unless the
caller has `profile.view.pii` permission.

### `tenant_members` (owned by `identity/user/`)

Pivot for multi-tenant membership within an Application.

| Column             | Type        | Notes                                          |
| ------------------ | ----------- | ---------------------------------------------- |
| `id`               | uuid        | prefixed `tmb_`                                |
| `user_id`          | uuid        | FK users.id, CASCADE                           |
| `tenant_id`        | uuid        | FK tenants.id, CASCADE                         |
| `role_id`          | uuid        | FK roles.id, RESTRICT                          |
| `is_default`       | bool        | user's landing tenant                          |
| `is_staff_only`    | bool        | membership excluded from athlete/parent counts |
| `joined_at`        | timestamptz | not creation-audit — actual join event         |
| `invited_by`       | uuid        | FK users.id, nullable                          |
| `last_active_at`   | timestamptz | updated on request                             |
| audit + timestamps |             |                                                |

`UNIQUE(user_id, tenant_id)` — one membership per (user, tenant).

## 5. Athletes as principals — first-class flow

Athletes are **domain entities** (in the future `sports/athletes/` module), not
user types. The `athletes.user_id` column is nullable — a minor athlete has no
login; a teen or adult athlete does.

### Three scenarios all supported

| Scenario                        | User row                                       | AthleteGuardian rows                                          | Auth flow                                                                                                                             |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Minor athlete (5-12yo)          | `athletes.user_id = NULL`                      | 1+ parent guardians                                           | Parents log in via `sanctum` guard; child has no login                                                                                |
| Teen athlete (13-17yo)          | `athletes.user_id = usr_...`                   | 1+ parent guardians                                           | Both teen and parents log in; teen has `athlete` role with `.own` permissions; parents have `guardian` role with `.child` permissions |
| Adult athlete (18+)             | `athletes.user_id = usr_...`                   | 0 guardians                                                   | Only athlete logs in; no parental portal                                                                                              |
| Athlete graduating to adulthood | `athletes.user_id` populated at teen milestone | Guardian rows soft-deleted or downgraded to `view_only` at 18 | Lifecycle transition via scheduled command                                                                                            |

### Row-level access — the `.own` scope

The `athlete` role holds permissions with the `.own` suffix by convention:

```
athletes.view.own
athletes.update.own.limited          # profile bits, not medical
attendance.view.own
progress.view.own
sessions.view.own
memberships.view.own
teams.view.own                        # only teams the athlete plays on
performance.view.own
coaches.view.own                      # only coaches the athlete works with
```

The `.own` scope is enforced by the base repository — every query joins against
`resource.user_id = current_user_id` when the caller's applicable permission
carries `.own`. See §6 below for the resolution.

### Provisioning flow — adding a login to an existing minor athlete

1. Parent or admin invokes "invite my child" from the parent/staff portal
2. `sports/athletes/RegistrationPolicy` (Wave 7 domain module) checks:
   - `compliance.coppa.age_threshold` (hard floor)
   - `compliance.gdpr.per_country[region].minor_age` (regional floor)
   - `entitlements.athlete_portal` (tier gate)
   - `settings::get('athletes.portal.min_login_age', $tenant)` (tenant override)
3. If allowed → creates an `Invitation` (from `access/invitations`) with
   `initial_role = athlete`
4. Invitee accepts → `identity/user/ProvisionUser` action creates `Identity` (if
   none exists) → `User` (per Application) → `Profile`
5. `sports/athletes/LinkAthleteToUser` action sets `athletes.user_id`
6. Existing `AthleteGuardian` rows preserved with `can_manage` downgraded per
   age policy

### Age transitions — automated lifecycle

Scheduled command `athletes:process-age-transitions` (runs daily):

- Athletes reaching `notify_athlete_at_age` (default 15) → dispatch preview
  notification to teen and guardians
- Athletes reaching `can_manage_below_age` (default 16) →
  `AthleteGuardian.can_manage` = false; teen gets edit-own permissions
- Athletes reaching `adult_transition_age` (default 18) → guardian rows
  soft-deleted; athlete gains full self-management; medical + financial data
  transferred to athlete's own consent

## 6. Configuration model — layered resolution

Four-layer config, resolved via the `scope` substrate at request time. Each
layer overrides the previous unless a compliance floor rejects.

```
Framework defaults (config/*.php in the owning module)
    ↓ overridden by
Business-type defaults (seeded from business_types.default_config)
    ↓ overridden by
Tenant settings (admin UI in stackra/settings, per-tenant DB rows)
    ↓ overridden by
Region overrides (if tenant operates across regions)

BLOCKED BY:
Compliance floors (COPPA/GDPR/FERPA age thresholds — no override possible)
```

### Compliance floors — inviolable

The compliance layer imposes hard floors. Tenant settings can only _tighten_,
never loosen. Concrete floors:

| Rule                                     | Floor                                       | Source                                                                             |
| ---------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| Minimum principal age                    | 13 in US (COPPA); varies 13-16 in EU (GDPR) | `compliance.coppa.age_threshold`, `compliance.gdpr.per_country[country].minor_age` |
| Educational-records disclosure (US only) | FERPA compliance mode enabled               | `compliance.ferpa.enabled`                                                         |
| Data residency                           | Tenant's `region.data_residency_zone`       | `compliance.data_residency.*`                                                      |

If a tenant sets `athletes.portal.min_login_age = 8`, and their region enforces
COPPA (US), the effective floor is 13. The tenant setting is silently clamped
up. Audit log records the clamp.

### Config keys owned by identity modules

**`identity/auth/config/auth.php`** — generic authentication policy:

```php
return [
    'principal' => [
        'min_age' => env('AUTH_MIN_PRINCIPAL_AGE', 13),
        'require_guardian_approval_below' => 16,
        'require_email_verification' => true,
    ],
    'password' => [
        'min_length' => 12,
        'require_uppercase' => true,
        'require_number' => true,
        'require_symbol' => false,
        'breach_check_enabled' => true,
        'history_size' => 5,
    ],
    'session' => [
        'idle_ttl_minutes' => 60 * 8,
        'absolute_ttl_hours' => 24 * 7,
        'refresh_ttl_days' => 30,
    ],
    'lockout' => [
        'max_failed_attempts' => 5,
        'lockout_minutes' => 15,
        'progressive_backoff' => true,
    ],
    'jwt' => [
        'algorithm' => 'HS256',
        'issuer' => env('JWT_ISSUER', 'https://identity.stackra.com'),
        'ttl_seconds' => 900,
        'refresh_ttl_seconds' => 60 * 60 * 24 * 30,
        'kid_current' => env('JWT_KID_CURRENT'),
        'kid_previous' => env('JWT_KID_PREVIOUS'),
    ],
    'cross_app_sso' => [
        'enabled' => env('AUTH_CROSS_APP_SSO', false),
        'grant_ttl_seconds' => 300,
    ],
];
```

**`identity/mfa/config/mfa.php`** — MFA enrolment + enforcement:

```php
return [
    'required_for_roles' => ['owner', 'admin', 'billing_manager', 'super_admin'],
    'grace_days_after_enrollment' => 7,
    'totp' => [
        'issuer' => env('MFA_TOTP_ISSUER', 'Stackra'),
        'digits' => 6,
        'period_seconds' => 30,
        'algorithm' => 'SHA1',
    ],
    'recovery_codes' => [
        'count' => 10,
        'length' => 10,
    ],
    'webauthn' => [
        'enabled' => env('MFA_WEBAUTHN_ENABLED', true),
        'require_resident_key' => false,
        'user_verification' => 'preferred',
    ],
];
```

**`identity/user/config/user.php`** — user-lifecycle policy:

```php
return [
    'registration' => [
        'self_registration_enabled' => env('USER_SELF_REGISTRATION', false),
        'requires_invitation' => env('USER_REQUIRES_INVITATION', true),
        'requires_admin_approval' => false,
    ],
    'profile' => [
        'require_first_last_name' => true,
        'require_phone' => false,
        'allow_avatar_upload' => true,
        'max_avatar_size_kb' => 2048,
    ],
    'privacy' => [
        'minor_data_visibility' => 'guardian_only',
        'adult_transition_age' => 18,
    ],
];
```

**`identity/service-accounts/config/service-accounts.php`** — SA lifecycle:

```php
return [
    'rotation' => [
        'default_secret_ttl_days' => 90,
        'warning_days_before_expiry' => 14,
    ],
    'jwt' => [
        'ttl_seconds' => 300,
        'clock_skew_seconds' => 30,
    ],
];
```

### Registration policy — pluggable via contract

`identity/auth` ships `RegistrationPolicyInterface`:

```php
interface RegistrationPolicyInterface
{
    /**
     * Evaluate whether a principal can be registered given the context.
     *
     * @return RegistrationDecision::Allowed
     *       | RegistrationDecision::RequiresGuardianConsent
     *       | RegistrationDecision::Denied
     */
    public function evaluate(RegistrationContext $context): RegistrationDecision;
}
```

Default implementation `GenericRegistrationPolicy` enforces:

1. Age against `auth.principal.min_age` (with compliance floor)
2. Email verification if `auth.principal.require_email_verification`
3. Invitation-required check if `user.registration.requires_invitation`

Domain modules register their own implementations via `#[Bind]` scoped to a
Registration Context type. Example — `sports/athletes` module (Wave 7) will bind
`AthleteRegistrationPolicy` for contexts where
`$context->principal_type == 'athlete'`.

## 7. Authentication flows

### 7.1 Login (Sanctum-backed)

```
POST /api/v1/auth/login
  Headers: X-Application-Id: app_sports
  Body: { email, password }

1. AuthController resolves Identity by email
2. Verifies password against Identity.password_hash
3. Checks lockout status; increments failed count on mismatch
4. Resolves User = Identity × X-Application-Id — 404 if not provisioned
5. Checks User.status = active — 403 with reason if not
6. If Identity.mfa_secret is set → issues MFA challenge (returns 202 with challenge_id)
7. Otherwise → issues Sanctum PAT scoped to (User, Application, home tenant)
8. Returns 200 with { token, user, tenant, roles, permissions }
```

### 7.2 MFA challenge

```
POST /api/v1/auth/mfa/verify
  Body: { challenge_id, code }

1. Validates code against TOTP secret OR WebAuthn assertion OR recovery code
2. On success: issues Sanctum PAT (same as post-login)
3. On failure: increments failed count; challenge expires after 3 attempts
```

### 7.3 Refresh

```
POST /api/v1/auth/refresh
  Body: { refresh_token }

1. Validates refresh token (opaque, DB-backed)
2. Reissues Sanctum PAT + new refresh token
3. Rotation: old refresh token revoked; new one issued
4. Detects reuse (already-consumed refresh) → invalidates all tokens for the User (breach detection)
```

### 7.4 Cross-app SSO grant

```
POST /api/v1/auth/cross-app/grant
  Headers: Authorization: Bearer <current session PAT>
  Body: { target_application_id }

1. Validates current session
2. Resolves target User = Identity × target_application_id — 404 if not provisioned
3. Issues short-lived grant token (300s TTL, tenant-scoped nonce)
4. Grant is one-time-use, cross-CORS-safe (query param)

Target Application receives:
POST /api/v1/auth/cross-app/exchange
  Headers: X-Application-Id: <target app>
  Body: { grant_token }

1. Validates grant against identity-service via JWKS + sig check
2. Grant is consumed atomically
3. Issues target-app Sanctum PAT
```

### 7.5 Password reset

```
POST /api/v1/auth/password/forgot
  Body: { email }

1. Always returns 200 (email-enumeration safety)
2. If Identity exists: generates reset token, emails link
3. Token TTL: 15 minutes

POST /api/v1/auth/password/reset
  Body: { reset_token, new_password }

1. Validates token
2. Enforces password policy (min length, complexity, breach check)
3. Rejects if password appears in Identity.password_history
4. Updates hash, revokes all sessions, adds to history (rolling window)
5. Sends confirmation email
```

## 8. Token contracts

### 8.1 Sanctum PAT format

Opaque bearer, database-backed:

```
Header: Authorization: Bearer 42|abcdef...
```

Where `42` is the token ID and `abcdef...` is the SHA-256 hash of the secret.
Never leaves the identity-service or its co-hosted services.

Stored in `personal_access_tokens` (standard Sanctum table) with:

- `abilities` = permission array (compact form; caches full set from RBAC on
  issue)
- `expires_at` = per `auth.session.absolute_ttl_hours`
- `last_used_at` = updated on request (async, batched)

### 8.2 Inter-service JWT

HS256, signed by identity-service with per-application secret. Sample:

```json
{
  "iss": "https://identity.stackra.com",
  "aud": ["sports.stackra.com"],
  "sub": "usr_01H...",
  "app": "app_sports",
  "tid": "tnt_01H...",
  "sco": {
    "org_id": "org_01H...",
    "branch_id": "brn_01H..."
  },
  "roles": ["coach"],
  "permissions": ["athletes.view.branch", "sessions.create.own"],
  "kid": "identity-2026-01",
  "iat": 1735689600,
  "exp": 1735690500,
  "jti": "jwt_01H..."
}
```

`app` claim is load-bearing. Downstream service checks
`payload.app === config('app.slug')` before trusting any other claim. Mismatch →
403 `application_mismatch`.

### 8.3 JWKS

`GET /.well-known/jwks.json` on identity-service. Returns:

```json
{
  "keys": [
    { "kty": "oct", "kid": "identity-2026-01", "alg": "HS256", "k": "..." },
    { "kty": "oct", "kid": "identity-2025-12", "alg": "HS256", "k": "..." }
  ]
}
```

**HS256 keys are shared secrets.** JWKS on public endpoint is safe only when
identity-service and downstream services communicate over a private network, OR
when we upgrade to RS256/ES256 (asymmetric) for public deployment. Wave 1a ships
HS256 for the initial single-cluster deployment; RS256 lands in Wave 1c with the
oauth/sso split.

## 9. Row-level ownership — the `.own` scope pattern

Permissions carry a **scope suffix** by convention. Repository queries pattern-
match on the scope and apply the corresponding filter.

| Suffix          | Filter applied by base repository                                          |
| --------------- | -------------------------------------------------------------------------- |
| `.any`          | Cross-tenant admin — no filter (`platform_admin` guard only)               |
| `.tenant`       | Within active tenant — filter `WHERE tenant_id = current_tenant`           |
| `.organization` | Within active org — filter `WHERE organization_id = current_org`           |
| `.branch`       | Within active branch — filter `WHERE branch_id = current_branch`           |
| `.team`         | Within teams the caller coaches or plays on — filter via TeamMember join   |
| `.child`        | For any resource linked via AthleteGuardian — filter via guardian join     |
| `.own`          | Only rows the caller directly owns — filter `WHERE user_id = current_user` |

The `identity/auth` module ships the `ScopeSuffixResolver` service that
enumerates a caller's permissions, resolves the scope suffix per permission, and
returns the applicable filter clause. Every base repository (in
`framework/crud`) consumes this at query build time.

Scope suffix resolution is **deny-by-default**. A permission without a
recognisable suffix is treated as `.any` (platform-admin-only) unless explicitly
configured.

## 10. Compliance floors — hard-coded resolution

`identity/auth/CompliantAgePolicy` service resolves the effective minimum age.
Chain:

1. **US COPPA** — if
   `compliance.coppa.enabled && $region.country_code === 'US'`, floor is 13
2. **EU GDPR** — if
   `compliance.gdpr.enabled && $region.country_code IN (EU country list)`, floor
   is `compliance.gdpr.per_country[country_code].minor_age` (13-16)
3. **Framework default** — `auth.principal.min_age` (default 13)
4. **Tenant override** — `settings::get('auth.principal.min_age', $tenant)` —
   MAX(all previous floors, this value)

Compliance floors are checked **before** any tenant setting is consulted. Tenant
admins can raise the effective minimum (require 18+) but never lower it below
the compliance floor.

## 11. Cross-module dependencies

```
identity/identity  ────►  (root, no deps)
        ▲
        │
        │
identity/user  ────►  identity/identity, platform/application, platform/tenancy
        ▲
        │
        │
identity/platform-user  ────►  identity/identity
identity/service-accounts  ────►  platform/application (optional tenant scope)
identity/mfa  ────►  identity/identity
identity/auth  ────►  identity/{identity, user, mfa, service-accounts},
                     platform/{application, tenancy}
```

Access modules depend on `identity/user` for the User principal. Domain modules
depend on `identity/user` for the User → resource FK.

## 12. Non-goals

- **No OAuth server in Wave 1a.** Deferred to `identity/oauth/` (Wave 1c) when
  we actually have third-party integration partners.
- **No SAML/OIDC federation in Wave 1a.** Deferred to `identity/sso/` (Wave 1c).
  Enterprise buyers who need this get it via cross-app SSO grants + our own
  login for now.
- **No SCIM auto-provisioning.** Deferred. Manual provisioning + invitations
  cover Wave 1a.
- **No passwordless-first flow.** WebAuthn is offered as a second factor but not
  as the primary factor. Reconsidered in Wave 1c.
- **No RS256/ES256 JWT signing in Wave 1a.** HS256 with rotated shared secrets
  is sufficient for single-cluster deployment. Upgrade to asymmetric with Wave
  1c.
- **No Identity merging.** If a human has two Identity rows (e.g. registered
  twice with different emails), they stay separate. Merging is a manual
  operations task with explicit consent — deferred to Wave 4.
- **No shared password storage across Identities.** Each Identity has its own
  hash. Cross-app SSO is grant-based, not credential-shared.
- **No delegated authentication in Wave 1a.** Users authenticate as themselves.
  Impersonation (support-agent-acts-as-user) lands in `access/ delegation` (Wave
  1b), gated behind strict audit and consent.

## 13. Cross-references

- `.kiro/steering/hierarchy.md` §3 — Identity vs User split (D1)
- `.kiro/steering/hierarchy.md` §4 — Two-audience boundary (D2 consequence)
- `.kiro/steering/hierarchy.md` §12 — Service split (identity-service is SHARED
  across all Applications)
- `.kiro/steering/tenancy-columns.md` §2 — The eight rows carrying
  `application_id` directly (includes `users`, `platform_users`,
  `service_accounts`)
- `.kiro/steering/tenancy-columns.md` §3 — Row-level attribution via
  `BelongsToTenant`
- `modules/identity/README.md` — module tier index
- Sibling spec: `.kiro/specs/access-approvals/design.md` — Wave 1b design
