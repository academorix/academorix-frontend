# auth

The protocol layer that operates on the Identity substrate. Wave 1a
security-tier infrastructure, priority 25 — boots last among the identity
modules because it depends on every one of them.

## 1. What this module owns

| Concern                                    | Owned artefact                                                                                                          |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Sanctum PAT lifecycle                      | `LoginAction`, `LogoutAction`, `LogoutAllDevicesAction`, `SessionRevoker`                                               |
| Refresh-token rotation + reuse detection   | `RefreshAction`, `RefreshTokenObserver`, `RefreshTokenReuseDetected` event → `LockdownOnBreachDetected` listener        |
| MFA challenge dispatch                     | `MfaChallengeAction`, `MfaVerifyAction`, `MfaChallengeDispatcher` (bridges to `identity/mfa` verification)               |
| Password reset flow                        | `ForgotPasswordAction`, `ResetPasswordAction`, `PasswordResetTokenIssuer`, 15-minute TTL                                |
| Email verification flow                    | `RequestEmailVerificationAction`, `VerifyEmailAction`, `EmailVerificationTokenIssuer`, 24-hour TTL                     |
| Cross-Application SSO grants               | `IssueCrossAppGrantAction`, `ExchangeCrossAppGrantAction`, `CrossAppGrantIssuer`, 300-second TTL                       |
| Inter-service JWT signing + verification   | `JwtSigner`, `JwtVerifier`, `JwtKeyRotator`, HS256 with per-Application `app` claim + `kid` rotation                  |
| JWKS endpoint                              | `PublishJwksAction`, `/.well-known/jwks.json`, aggressive Cache-Control per config                                     |
| JWT deny list                              | `JwtDenyListManager`, `RevokeJwtAction`, `auth_jwt_deny_list` table                                                     |
| Scope-suffix resolution                    | `ScopeSuffixResolver` — the service the base repository consults for `.own` / `.tenant` / `.branch` / `.team` filters  |
| Compliant age policy                       | `CompliantAgePolicy` — resolves the effective floor from COPPA / GDPR / framework default / tenant override            |
| Registration policy strategy               | `RegistrationPolicyInterface` + default `GenericRegistrationPolicy`; domain modules override via `#[RegistrationPolicy]` |
| Impersonation session start / end          | `ImpersonateStartAction`, `ImpersonateEndAction`, composes `access/delegation` (Wave 1b) for session storage           |
| Session revocation on credential mutation  | `RevokeAllActiveSessionsListener` on `identity::PasswordChanged` / `MfaDisabled` / `IdentityLocked`                    |
| Platform-admin identity CRUD (HTTP)        | `IdentitiesController` under `/api/v1/platform/identities/*` — the HTTP surface for the substrate that owns no routes |

### 1.1 What this module explicitly does NOT own

- **Credential storage** — every password hash, MFA secret, MFA recovery
  code, email verification state, and lockout state lives in the
  `identity/identity` substrate. This module DELEGATES every verify /
  reset / lockout to the substrate.
- **User provisioning** — `user::User` (per-Application projection) is
  owned by `identity/user`. Auth composes UserRepository::provision(...)
  during registration; it does not own the provisioning schema.
- **MFA challenge verification** — TOTP + WebAuthn + recovery-code
  comparison lives in `identity/mfa`. This module OWNS the challenge
  dispatch + wait state; MFA OWNS the algorithmic verification.
- **RBAC vocabulary** — roles + permissions live in `access/rbac` (Wave
  1b). Auth caches the compact permission array on the Sanctum PAT's
  abilities column at issue-time from RBAC, but does not manage the
  vocabulary.
- **Impersonation session storage** — the impersonation-session row
  itself lives in `access/delegation` (Wave 1b). This module starts + ends
  sessions; delegation owns the row.
- **OAuth server** — deferred to `identity/oauth` (Wave 1c).
- **SAML / OIDC federation** — deferred to `identity/sso` (Wave 1c).

## 2. The three planes — tenant, platform, public

Auth's HTTP surface splits three ways. Each plane has different
middleware, different guards, and different consent semantics.

### 2.1 Tenant plane — `/api/v1/auth/*`

Guard: `sanctum`. Every request carries `X-Application-Id`. The plane
handles interactive tenant-user session lifecycle:

- POST `/register` — new Identity + User for the resolved Application
- POST `/login` — password + optional MFA
- POST `/mfa/verify` — MFA challenge verify
- POST `/refresh` — refresh rotation with reuse detection
- POST `/logout` / `/logout-all-devices`
- POST `/password/forgot` / `/password/reset` / `/password/change`
- POST `/email/request-verification` / `/email/verify`
- POST `/cross-app/grant` / `/cross-app/exchange`
- GET `/me`, GET `/sessions`, DELETE `/sessions/{session}`

### 2.2 Platform plane — `/api/v1/platform/auth/*` + `/api/v1/platform/identities/*` + `/api/v1/platform/jwt-*`

Guard: `platform_admin`. No `X-Application-Id` (platform staff are
cross-Application). Handles Academorix-staff auth, identity CRUD, JWT
key management, impersonation.

- POST `/platform/auth/login` / `/mfa/verify` / `/refresh` / `/logout`
- POST `/platform/auth/password/forgot` / `/password/reset`
- POST `/platform/auth/impersonate/start` / `/impersonate/end`
- CRUD on `/platform/identities/*` (list, show, unlock, force-reset,
  erase — the HTTP surface for the identity substrate)
- CRUD on `/platform/jwt-signing-keys/*` (list, rotate)
- POST `/platform/jwt-deny-list` (add jti)

### 2.3 Public plane

Unauthenticated. Two endpoints:

- GET `/.well-known/jwks.json` — public JWKS payload with aggressive
  Cache-Control. Every downstream service caches this for JWT
  verification.
- GET `/api/health/auth` — auth-service health probe.

## 3. The three token classes

Auth issues three token classes, each with a different purpose and a
different lifetime.

### 3.1 Sanctum PAT (opaque bearer, session-scoped)

Issued at login. Format: `<id>|<secret>`. Stored in Sanctum's shipped
`personal_access_tokens` table with:

- `abilities` = the compact permission array + a `_app` pseudo-ability
  binding the token to a specific Application scope
- `expires_at` = per `auth.session.absolute_ttl_hours`
- `last_used_at` = updated async (batched) to reduce write pressure

Consumed by identity-service and by services co-hosted with it. Never
transits to downstream services — those use JWT (§3.3).

### 3.2 Refresh token (opaque, rotation-with-reuse-detection)

Paired with every Sanctum PAT. Format: opaque 40-byte random secret.
Stored in `auth_refresh_tokens` with:

- `family_id` — every rotation shares a family
- `token_hash` — SHA-256 at rest; plaintext returned once at issue
- `consumed_at` — set on rotation; presenting a consumed token again is
  a BREACH signal per RFC draft-ietf-oauth-security-topics §4.13

On reuse detection: fires `RefreshTokenReuseDetected` →
`LockdownOnBreachDetected` listener invalidates every token in the
family + revokes every active PAT for the User + writes a
compliance-audit entry + notifies the User of the breach signal.

### 3.3 Inter-service JWT (HS256, kid-rotated, per-Application-bound)

Signed by identity-service, verified locally by every downstream
service. Carries:

```
iss: https://identity.academorix.com
aud: [sports.academorix.com]
sub: usr_01H...
app: app_sports          ← per-Application binding
tid: tnt_01H...
sco: { org_id, branch_id }
roles: [coach]
permissions: [athletes.view.branch, sessions.create.own]
kid: identity-2026-07-1
iat, exp, jti
```

The `app` claim is load-bearing. Downstream services check
`payload.app === config('app.slug')` before trusting any other claim.
Mismatch → 403 `JWT_APPLICATION_MISMATCH`.

JWKS at `/.well-known/jwks.json` publishes every active + retired-not-
yet-expired key. Rotation via `kid` header + 7-day grace window per
`auth.jwt.rotation_grace_period_days`.

## 4. The seven owned tables

All seven tables are enumerated in `schemas/`. Highlights:

- `personal_access_tokens` — Sanctum's shipped table, used as-is.
- `auth_refresh_tokens` — refresh tokens, polymorphic tokenable, family_id
  chain, reuse-detection.
- `auth_password_resets` — 15-minute TTL reset tokens.
- `auth_email_verifications` — 24-hour TTL verification tokens.
- `auth_mfa_challenges` — 5-minute TTL pending-login challenges with
  context blob (application_id, tenant_id, requested_scope) so the login
  flow can resume after verification.
- `auth_cross_app_grants` — 300-second TTL grant tokens.
- `auth_jwt_deny_list` — `jti` deny list until natural expiry.
- `auth_jwt_signing_keys` — HS256 shared secrets (KMS-encrypted at rest)
  with kid + Application binding.

None of these tables carry `tenant_id`. Every table either references
`identity_id` directly (password resets, email verifications, MFA
challenges, cross-app grants) or is polymorphic to
`User`/`PlatformUser` (refresh tokens), or is per-Application (JWT
signing keys, with nullable application_id for the global slot).

## 5. Refresh rotation — the reuse-detection breach signal

The canonical OAuth 2.0 BCP defense from
`draft-ietf-oauth-security-topics` §4.13. Sequence:

1. Client presents refresh token A.
2. Server hashes A → looks up the row. `consumed_at IS NULL` →
   proceed.
3. Server inside a transaction: `UPDATE auth_refresh_tokens SET
   consumed_at = now() WHERE id = A.id`. Then `INSERT INTO
   auth_refresh_tokens (..., family_id = A.family_id) VALUES (...)` for
   the successor B. Then issue a fresh Sanctum PAT paired with B.
4. Response returns B's plaintext + the new PAT.

If the client (or an attacker) presents A a second time:

5. Server hashes A → looks up the row. `consumed_at IS NOT NULL` →
   REPLAY.
6. Fire `RefreshTokenReuseDetected`.
7. `LockdownOnBreachDetected` listener: revoke every token in family A
   (both consumed A and successor B, and any further descendants). Revoke
   every active PAT for the User. Return 401 `REFRESH_TOKEN_INVALID`
   to the caller (deliberately opaque — not `REFRESH_TOKEN_REUSE_DETECTED`
   so an attacker can't confirm the breach signal from the response).
8. Fire `AllSessionsRevoked(reason=refresh_reuse)`.
9. Log a critical-severity audit entry naming the family_id.

The critical property: EVEN IF the attacker holds both A and B, and
uses A first (before the legitimate client uses A → B rotation), the
attacker's A becomes consumed. When the legitimate client rotates A
next, they detect the reuse — and lockdown fires. Every token dies. The
attacker is locked out along with the user, and the user detects the
compromise via the notification.

## 6. Cross-Application SSO grants

Grant flow when a User in App A wants to switch to App B (both linked to
the same Identity):

1. POST `/auth/cross-app/grant { target_application_id: app_b }` on App
   A's auth-service, with the current Sanctum PAT.
2. Server: validate current session. Verify caller has a User row on App
   B (else 404 `CROSS_APP_USER_NOT_PROVISIONED`). Issue a 300-second
   grant token, hashed at rest.
3. Response: grant plaintext + target_application_id.
4. Client redirects to App B's auth-service.
5. POST `/auth/cross-app/exchange { grant_token: ... }` with
   `X-Application-Id: app_b`.
6. Server: hash → look up row. Verify not consumed, not expired,
   target_application_id matches current request scope. Resolve target
   User = Identity × app_b. Issue fresh Sanctum PAT + refresh. Consume
   grant atomically.
7. Response: fresh session (LoginResult shape).

Grants are one-time-use, cross-CORS-safe (query param), never
credential-shared. Requires `cross_app_sso` entitlement on the caller's
current tenant.

## 7. Session revocation on credential mutation

The load-bearing invariant from design.md §8. When an Identity's
password changes (voluntarily, via reset, or by admin action), every
session across every Application the human uses is revoked. One
action → total lockout.

Chain:

```
Identity->changePassword(...) [tx]
    ↓ (after-commit)
Fires: identity::PasswordChanged
    ↓
auth::RevokeAllActiveSessionsListener (queue: notifications-critical)
    ↓
dispatches RevokeAllActiveSessionsJob
    ↓
Enumerates every users.id where users.identity_id = target
For each User: enumerate active PATs → batched revoke + fire per-token
   SessionRevoked events (5000-token batches to avoid load spikes)
Also revoke every active refresh_token in the family_id chain for these
   Users
Fires AllSessionsRevoked once with aggregated count
```

The listener is idempotent — retrying after partial success doesn't
double-fire downstream effects. Same shape for `identity::MfaDisabled`
and `identity::IdentityLocked`.

## 8. Compliant age policy — the age-gate composition

`CompliantAgePolicy::resolveFloor($regionCountryCode, $tenantId)` walks:

1. **US COPPA** — country_code = 'US' → floor 13 (16 CFR § 312).
2. **EU GDPR** — country_code ∈ EU list → floor from
   `compliance.gdpr.per_country[country_code].minor_age` (13–16 per
   member state).
3. **Framework default** — `auth.principal.min_age` (default 13).
4. **Tenant override** — MAX(above, `settings::get('auth.principal.min_age',
   $tenant)`).

The result is the effective floor. Applications call
`isAllowed($ageAtRegistration, $regionCountryCode, $tenantId)` which
returns one of:

- `Allowed` — age >= floor + adult transition age
- `RequiresGuardianConsent` — age between minor floor and
  `auth.principal.require_guardian_approval_below` (default 16)
- `Denied` — age below the applicable floor

Registration flows compose this into their `RegistrationPolicyInterface`
implementations. Domain-specific policies (e.g. Wave 7 sports/athletes)
add parent-consent workflow when `RequiresGuardianConsent` fires.

## 9. Scope-suffix resolution — the `.own` / `.tenant` / etc. pattern

Permissions in Academorix carry a scope suffix by convention:

| Suffix           | Filter applied by base repository                                  |
| ---------------- | ------------------------------------------------------------------ |
| `.any`           | Cross-tenant admin — no filter (`platform_admin` guard only)       |
| `.tenant`        | Within active tenant — `WHERE tenant_id = current_tenant`          |
| `.organization`  | Within active org — `WHERE organization_id = current_org`          |
| `.branch`        | Within active branch — `WHERE branch_id = current_branch`          |
| `.team`          | Within teams the caller coaches/plays on — via TeamMember join     |
| `.child`         | For any resource linked via AthleteGuardian — via guardian join    |
| `.own`           | Only rows the caller owns — `WHERE user_id = current_user`         |

`ScopeSuffixResolver` enumerates the caller's permissions, resolves each
suffix to its filter clause, and returns a `ScopeFilterClause` value
object. The base repository in `framework/crud` (Wave 2) consumes it at
query-build time to apply the correct WHERE clause per permission.

Deny-by-default: a permission without a recognisable suffix is treated
as `.any` (platform-admin-only) unless explicitly configured. This
prevents "forgot to suffix" bugs from silently opening up scope.

## 10. Configuration surface

Four layers of config resolve at request time (per design.md §6):

```
Framework defaults (config/auth.php)
    ↓ overridden by
Business-type defaults (from tenants.business_type.default_config)
    ↓ overridden by
Tenant settings (via academorix/settings, per-tenant DB rows)
    ↓ overridden by
Region overrides (when tenant operates cross-region)

BLOCKED BY:
Compliance floors — COPPA / GDPR / NIST 800-63B (no override possible)
```

Tenant admins can TIGHTEN policy (require 18+ for registration, longer
password rotation, stricter MFA) but never LOOSEN below the compliance
floor. See `settings.json` for the tenant-configurable groups.

## 11. HTTP surface — see routes.json

35 routes total across three planes. Every mutation is idempotent under
retry OR explicitly one-time-consume-atomic (registration, reset, MFA
verify, cross-app exchange). Every route in this module ships:

- request.id middleware
- versioning.resolve
- auth.cors_strict (whitelist per Application)
- appropriate guard (sanctum / platform_admin / none for public)
- appropriate throttle (foundation-base / foundation-platform /
  foundation-public)
- response.envelope
- auth-specific extras (rate_limit_login on unauthenticated login flow,
  enforce_session_scope on authenticated tenant flow)

## 12. What this module does NOT do (non-goals)

Cross-referenced with design.md §12:

- **No OAuth server** — deferred to `identity/oauth` (Wave 1c) when
  we actually have third-party integration partners.
- **No SAML / OIDC federation** — deferred to `identity/sso` (Wave 1c).
  Enterprise buyers who need this get it via cross-app SSO grants + our
  own login for now.
- **No SCIM auto-provisioning** — deferred.
- **No passwordless-first flow** — WebAuthn is offered as a second
  factor via `identity/mfa` but not as the primary factor. Reconsidered
  in Wave 1c.
- **No RS256 / ES256 JWT signing** — HS256 with rotated shared secrets
  in Wave 1a. Upgrade to asymmetric with Wave 1c when public federation
  lands. HS256 shared secrets on the public JWKS endpoint are safe ONLY
  when identity-service and downstream services communicate over a
  private network (design.md §8.3 caveat).
- **No shared password storage across Identities** — cross-app SSO is
  grant-based, not credential-shared.
- **No delegated authentication in Wave 1a** — impersonation
  START-POINT is here; the delegation SESSION storage lands in
  `access/delegation` (Wave 1b).
- **No credential storage** — this module owns tokens, not passwords.
  Passwords, MFA secrets, recovery codes, email verification state,
  lockout state — all live in the `identity/identity` substrate.

## 13. Cross-references

- `.kiro/specs/identity/design.md` — the locked spec this blueprint
  materialises (D1: Identity vs User split; D2: Tenants per Application;
  D3: JWT contract).
- `.kiro/steering/hierarchy.md` §7 — Authentication flows canonical
  vocabulary.
- `.kiro/steering/tenancy-columns.md` — column-attribution contract;
  auth tables are explicitly on the "NO tenant_id" side (except via
  polymorphic tokenable).
- `modules/shared/blueprints/localization/` — canonical style
  reference.
- `modules/identity/blueprints/identity/` — the substrate this module
  operates on.
- `modules/identity/blueprints/user/` — the per-Application User
  projection (Wave 1a).
- `modules/identity/blueprints/platform-user/` — the platform-admin
  principal (Wave 1a).
- `modules/identity/blueprints/mfa/` — TOTP + WebAuthn verification
  (Wave 1a).
- `modules/identity/blueprints/service-accounts/` — machine credentials
  for inter-service calls (Wave 1a).
- `modules/access/blueprints/rbac/` — role + permission vocabulary
  (Wave 1b).
- `modules/access/blueprints/delegation/` — impersonation session
  storage (Wave 1b).

## 14. Migration + rollout notes

- Depends on `foundation`, `compliance`, `identity`, `user`,
  `platform-user`, `mfa`, `service-accounts`, `application`, `tenancy`.
- Highest priority (25) among identity modules — boots last after every
  dependency is wired.
- Extended by `access/rbac` (Wave 1b) and every downstream tenant-plane
  module (indirectly via HTTP middleware).
- No existing rows to migrate — this is a from-scratch shipping in the
  identity-service Day-1 build.
- The JWT signing key MUST be configured to `kms` or `vault` in
  production; the local backend refuses to load when `APP_ENV=production`.
- The initial deployment requires KMS access even before the first
  session — `auth-jwt-signing-key-reachable` is a critical health probe.
- Every downstream service in the platform must consume the JWKS
  endpoint at `/.well-known/jwks.json` on identity-service. Cache
  Control: `public, max-age=3600, immutable`. Verifiers should cache
  aggressively.
