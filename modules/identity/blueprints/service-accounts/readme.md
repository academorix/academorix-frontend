# service-accounts

Machine credential substrate. Wave 1a security-tier infrastructure, priority
24 — sits between `identity/mfa` (priority 20) and `identity/auth` (priority
25) so `auth` can consume the SA registry when it wires the JWT signer.

## 1. What this module owns

| Concern                                     | Owned artefact                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Machine credential row                      | `ServiceAccount` (`application_id` + optional `tenant_id` + name + `signer_kid` + `secret_hash` + `expires_at`)    |
| Bcrypt-hashed rotation secret               | `SecretRotator` (wraps Hash facade; bcrypt cost 12; rotation writes a fresh hash + updates `secret_rotated_at`)    |
| Per-SA JWT signer contract                  | `ServiceAccountJwtIssuer` (bridges to `auth::JwtSigner`, keyed by `signer_kid`)                                    |
| Mandatory rotation lifecycle                | `expires_at` column + `RotationSchedulerService` + `NotifyRotationDueJob` (14-day warning) + `PurgeExpiredServiceAccountsJob` (daily) |
| Token-exchange endpoint                     | `POST /api/v1/service-accounts/token` — bcrypt secret → HS256 JWT                                                  |
| Heavy audit stamping                        | `service_account.audit` middleware (correlation_id + machine-context tags on every SA request)                     |
| Runtime JWT verification                    | `service_account.verify_jwt` middleware (composes `auth::JwtVerifier` + confirms SA is enabled + not expired)      |
| Scope enforcement                           | `service_account.enforce_scope` middleware (rejects `app`/`tid` claim mismatches against request headers)          |
| Dormant credential detection                | `DormantAccountDetector` + `DetectDormantServiceAccountJob` (weekly, reports SAs unused > 30 days)                 |
| Fingerprinter for anomaly detection         | `ServiceAccountFingerprinter` (IP + user-agent correlation for the suspicious-activity signal)                     |
| Platform-plane HTTP surface + Artisan CRUD  | `/api/v1/platform/service-accounts/*` + `service-account:*` commands                                               |

### 1.1 What this module explicitly does NOT own

- **JWT signing algorithm / key material** — that's `identity/auth`. This
  module ships the `signer_kid` column that NAMES the key; the key rows +
  the signing routine live in the auth module's `jwt_signing_keys` table.
- **JWKS endpoint** — `/.well-known/jwks.json` is served by the auth module
  from the same `jwt_signing_keys` table. Consumers of the token-exchange
  endpoint don't need JWKS on the Wave 1a HS256 deployment (the shared
  secret keyed by `kid` is compared server-side); JWKS matters when Wave 1c
  introduces RS256 asymmetric signing.
- **Interactive login flows** — service accounts NEVER interactively
  authenticate. No MFA, no email verification, no password reset, no
  session lifecycle. The token-exchange endpoint is the ONLY credential
  presentation path.
- **User provisioning / role attachment** — this module has no
  `identity_id`, no `user_id`, no `role_id`. Authorization is entirely
  claim-based: the JWT's `permissions[]` array is set at issue time by the
  provisioner action, and the auth module's issuer copies it verbatim into
  the JWT.
- **Cross-tenant service accounts on the same Application** — a SA is
  bound to ONE `application_id` at creation; a single SA cannot service
  multiple Applications. Multi-app machine integrations use one SA per app.
- **Impersonation of a human User** — a SA IS a principal, not a proxy for
  one. If a service call needs to act "on behalf of" a human, the caller
  passes the human's Sanctum PAT alongside the SA JWT; the downstream
  service inspects both and decides. This module never issues JWTs with a
  human's `sub` claim.

## 2. Boundary: why service accounts are a separate principal class

Every human-facing principal (User, PlatformUser) reuses the Identity
substrate for credentials. Service accounts do NOT — they carry their own
`secret_hash` on the SA row itself.

Concrete implications of that split:

- A SA has no `identity_id`. Zero coupling to the human-identity graph.
- Revoking a SA is a single `is_enabled=false` update — no cascade to
  Sanctum PATs, no session-revocation event, no notification pipeline.
- A SA's secret is NEVER stored in the `identities` table's password
  history. The two credential stores are independent.
- Breaching the `service_accounts` table exposes machine credentials
  only — human credentials on `identities` are untouched. Reciprocally,
  breaching `identities` doesn't expose any SA secret.

The design.md D2 lock ("Tenant per Application") applies to SAs too: a SA
bound to Application A cannot serve Application B, and a SA that carries
`tenant_id` cannot scope to a tenant on a different application than the
SA's `application_id`.

## 3. The three ways a service account authenticates

Service accounts NEVER present a raw secret to a business-logic endpoint.
The only ways they authenticate a request:

### 3.1 Direct JWT presentation

The SA holds a short-lived HS256 JWT (300s default TTL). Downstream
services receive:

```
Authorization: Bearer <jwt>
X-Service-Account-Id: svc_01H...
```

The `service_account.verify_jwt` middleware runs:

1. Extract `Authorization: Bearer <jwt>`.
2. Decode the `kid` from the JWT header.
3. Resolve the matching signer via `auth::JwtSigner::forKid($kid)`.
4. Verify signature + `iss` + `aud` + `exp` (with `clock_skew_seconds`
   tolerance).
5. Load `service_accounts` row via `X-Service-Account-Id` header (or
   `sub` claim if header absent). Confirm the row's `signer_kid ===
   payload.kid`.
6. Confirm `is_enabled = true` AND `expires_at IS NULL OR expires_at >
   now()`.
7. Confirm the SA's `application_id === payload.app` AND (if the SA is
   tenant-scoped) `tenant_id === payload.tid`.

Any check failure returns `401` with `SERVICE_ACCOUNT_JWT_INVALID` +
retryable=false. The failure reason is NEVER surfaced in the response —
downstream logs carry the specific reason for triage.

### 3.2 Token exchange (bcrypt secret → JWT)

The SA holds a bcrypt-hashed rotation secret. It exchanges via:

```
POST /api/v1/service-accounts/token
Content-Type: application/json

{
  "service_account_id": "svc_01H...",
  "secret": "<rotation-secret-plaintext>",
  "requested_scope": {
    "aud": "sports-service",
    "ttl_seconds": 300
  }
}
```

The exchange endpoint:

1. Rate-limits per-SA per-IP (5/min per SA-ID + 20/min per IP).
2. `Hash::check($secret, $sa->secret_hash)` — constant-time bcrypt
   comparison.
3. Confirms SA `is_enabled = true` AND `expires_at IS NULL OR expires_at >
   now()`.
4. Issues a JWT via `ServiceAccountJwtIssuer::issue($sa, $requested_scope)`.
5. Fires `ServiceAccountJwtIssued` event (queue = `notifications`).
6. Updates `last_used_at` + `last_used_ip` (batched via
   `UpdateLastUsedTimestampJob`).

Response body:

```json
{
  "data": {
    "token": "eyJhbGc...",
    "expires_in": 300,
    "token_type": "Bearer"
  }
}
```

Unknown SA-ID + wrong secret both return the same `401
INVALID_SERVICE_ACCOUNT_CREDENTIALS` payload — no enumeration signal.

### 3.3 Direct static token (deferred to Wave 1c)

Not shipped in Wave 1a. Reserved for future long-lived bearer tokens for
low-friction integrations (e.g. static webhook signers). The `personal_
access_tokens`-style row would live on this module's table with its own
`token_hash` column. Deferred because every current inter-service caller
has a mechanism to refresh via the exchange endpoint; static tokens raise
the compromise surface without a matching win.

## 4. The `application_id` binding is inviolable

Every ServiceAccount carries `application_id` DIRECTLY. This is one of the
eight rows enumerated in `.kiro/steering/tenancy-columns.md` §2.

- Creation: `application_id` is required + immutable. `PATCH` refuses to
  change it.
- Downstream JWT `app` claim = SA's `application_id`. The
  `ResolveApplication` middleware on receiving services confirms `app` ==
  their deployment's `config('app.slug')`; mismatch = 403
  `APPLICATION_MISMATCH`.
- Even a platform-plane SA (`tenant_id IS NULL`) is bound to one
  application. Cross-application platform tooling uses one SA per app.

The observer enforces that `tenant_id`, when populated, belongs to a tenant
whose `application_id` matches the SA's `application_id`. Attempting to
scope a Sports-app SA to a Marketplace-app tenant refuses with
`APPLICATION_MISMATCH_ON_TENANT`.

## 5. Signing keys — the `signer_kid` model

Each SA holds its OWN `signer_kid` at creation time. This gives per-account
revocation isolation:

- The `jwt_signing_keys` table (owned by `identity/auth`) holds N key rows,
  each with a unique `kid`, an `algorithm` (`HS256` in Wave 1a),
  `secret_material` (HS256 shared secret; 32-byte minimum enforced at
  creation), and `is_enabled`.
- Multiple SAs may share a kid IF they belong to the same application AND
  the operator chose to (mass-provisioned SAs for a fleet of workers).
- Disabling a kid revokes every JWT issued against it — so an incident
  responder can burn a compromised key without touching individual SA
  rows.
- Per-SA revocation (the more common case) flips `service_accounts.is_
  enabled = false`; the `service_account.verify_jwt` middleware refuses
  the request without consulting the kid deny-list.

Rotation writes a new secret hash + updates `secret_rotated_at`. The
`signer_kid` does NOT rotate on secret rotation — the kid names the JWT
signing key, not the exchange secret. Ops rotates the kid separately by
provisioning a fresh row in `jwt_signing_keys` and updating the SA's
`signer_kid` to point at the new key.

## 6. Rotation lifecycle

Mandatory rotation via `expires_at`. Default TTL is 90 days
(configurable). Timeline:

```
T=0:      SA created + first secret hashed
          expires_at = now() + 90d
          NotifyRotationDueJob will fire at T = 90d - 14d = T+76d

T+76d:    NotifyRotationDueJob dispatches ServiceAccountSecretRotationDueNotification
          to every Application owner PlatformUser (tenant + platform)

T+90d:    expires_at reached. Grace period begins:
          - service_account.verify_jwt STILL accepts JWTs signed before T+90d
            for their remaining lifetime (up to 300s = 5min after T+90d)
          - Token-exchange refuses new secret-swap with SERVICE_ACCOUNT_SECRET_EXPIRED

T+97d:    PurgeExpiredServiceAccountsJob (daily 04:00 UTC) soft-disables
          any SA whose expires_at + grace_days_after_expiry (default 7d)
          has passed. Fires ServiceAccountExpired event.

T+180d:   Soft-deleted rows past the retention hold (default 90d after
          disable) are hard-deleted by the same job.
```

Rotation is a WRITE, never a DELETE. `service-account:rotate` generates a
new secret, `SecretRotator::hash()` bcrypts it at cost 12, writes:

```sql
UPDATE service_accounts
   SET secret_hash = <new>,
       secret_rotated_at = now(),
       expires_at = now() + INTERVAL '<default_ttl_days> days'
 WHERE id = ?
```

Fires `ServiceAccountSecretRotated`. The plaintext new secret is
returned in the response ONCE and NEVER retrievable again. Lost secret →
another rotation, not a recovery flow.

### 6.1 Warning window

The `NotifyRotationDueJob` (weekly cadence, Mondays 08:00 UTC) enumerates
every SA whose `expires_at` falls inside the next
`warning_days_before_expiry` window (default 14). For each, dispatches
`ServiceAccountSecretRotationDueNotification` to:

- Every `platform_admin` role assignee scoped to the SA's `application_id`.
- Every operator whose email is listed in `service-accounts.rotation.
  notify_emails` config (if non-empty).

Deliberately does NOT dispatch to the SA itself — machines have no inbox.

## 7. Audit — the `service_account.audit` middleware

Every request presenting a SA JWT passes through
`service_account.audit` after `service_account.verify_jwt`. It writes:

1. **`service_account.request.audit`** activity_log row: method + path +
   status + service_account_id + application_id + tenant_id (if scoped) +
   ip (truncated to /24) + user_agent (truncated to 255) + correlation_id
   + duration_ms.
2. **`service_account.jwt_verified`** activity_log row keyed by the JWT's
   `jti` claim — provides jti-level replay-attack signal.
3. **N× audit rows via `HasAudit`** for every Eloquent write inside the
   request — one row per mutated model.

Every row shares a `correlation_id` (UUID from the middleware). Retention:
365 days hot, 7 years cold (SOC 2 evidence window).

Machine actions are cheaper than human ones but SIGNIFICANTLY more
frequent — this middleware is optimised: async row-write via
`UpdateLastUsedTimestampJob` and coalesced audit-log inserts on hot paths.
Do NOT decrement this cost by suppressing rows; the whole point of the
compliance floor is that every machine call is correlated.

## 8. Dormant credential detection

`DetectDormantServiceAccountJob` (weekly, Sundays 06:00 UTC) enumerates
every SA whose `last_used_at` is older than
`security.dormant_threshold_days` (default 30d). For each:

1. Skip if the SA was created within the threshold (fresh SAs are
   allowed to be dormant while ops finishes wiring).
2. Skip if the SA is already disabled.
3. Dispatch `ServiceAccountDormantNotification` to the SA's Application
   owners + the security-mailing-list.
4. Emit `academorix.service_account.dormant.detected` metric.

Operators triage: either wake the SA (record why), or disable + delete
(most dormant SAs are forgotten provisioning artefacts).

The FIRST request after a >30d silence fires `ServiceAccountUsageDetected`
(not `Dormant`) — a distinct compliance signal that a supposedly-idle
credential just woke up. Security should confirm the request is
legitimate. This is a classic ``dormant credential compromise'' signal.

## 9. Suspicious activity detection

`ServiceAccountFingerprinter` runs on every request through the audit
middleware. It maintains a rolling 30-day cache of `(sa_id, ip_prefix_24,
user_agent_hash)` tuples. When a NEW tuple appears alongside a spike in
request rate (>5x baseline), dispatch
`SuspiciousServiceAccountActivityNotification` to the SA's Application
owners + security.

Sensitivity: the baseline is per-SA per-hour rolling average. False
positives on legitimate deployments (new IP subnet, new UA) are expected;
the notification is informational, not blocking. Ops confirms → adds the
new tuple to an allowlist (config-level per-SA), OR rotates the secret if
compromise is suspected.

## 10. HTTP surface

### 10.1 Platform-plane CRUD (`platform_admin` guard, `/api/v1/platform/`)

- `GET /service-accounts` — list all SAs (super_admin only). Filters:
  `filter[application_id]`, `filter[tenant_id]`, `filter[is_enabled]`,
  `filter[has_expired]`, `filter[dormant_days]`.
- `POST /service-accounts` — create SA + rotate secret + return secret
  ONCE (never again). Body: `CreateServiceAccountInput`.
- `GET /service-accounts/{id}` — describe SA (no secret revealed).
- `PATCH /service-accounts/{id}` — update `name`, `description`,
  `is_enabled`, `expires_at`. NEVER `application_id`, NEVER `signer_kid`,
  NEVER `tenant_id` — those are set at creation and immutable.
- `DELETE /service-accounts/{id}` — soft-delete + disable.
- `POST /service-accounts/{id}/rotate-secret` — new secret + returned
  ONCE.
- `POST /service-accounts/{id}/issue-jwt` — issue a test JWT with a
  configurable scope + TTL. Body: `IssueTestJwtInput`.
- `GET /service-accounts/{id}/audit-usage` — usage report (24h / 7d / 30d
  windows).

### 10.2 Tenant-plane

NONE. Tenant admins cannot create or manage service accounts. If a tenant
needs a machine credential (e.g. their webhook signer), a platform_admin
creates it on the tenant's behalf with `tenant_id` scope. This preserves
the "tenants cannot see machine credentials" boundary.

### 10.3 Token exchange (public, unauthenticated)

- `POST /api/v1/service-accounts/token` — swap bcrypt secret for HS256
  JWT. Rate-limited aggressively per-SA per-IP. See §3.2 for the shape.

## 11. What this module does NOT do (non-goals)

- **No interactive UX** — SAs have no login page, no MFA, no password
  reset. Every operator action is CLI or admin-HTTP.
- **No cross-application SAs** — one SA is bound to one Application via
  FK. Blueprint enforces via the observer + the `PATCH` refusal to
  mutate `application_id`.
- **No tenant-admin management** — platform_admin only (per PlatformUser
  blueprint's `platform.tenant_admin` entitlement is required on top of
  the base `platform.service_accounts.hire` permission for cross-tenant
  provisioning).
- **No secret retrieval after creation** — the plaintext secret is shown
  ONCE in the creation + rotation response and NEVER retrievable again.
  Lost secret = mandatory rotation, not recovery.
- **No password-style history / reuse prevention** — SAs are rotated to
  fresh randomly-generated secrets; reuse is not a realistic threat.
- **No opt-out on the audit trail** — every SA request writes audit
  rows. The `service_account.audit` middleware is auto-applied to every
  route that verifies a SA JWT. There is no bypass.
- **No RS256/ES256 in Wave 1a** — HS256 with rotated per-kid shared
  secrets is Wave 1a. Wave 1c introduces RS256 alongside HS256 (both
  algorithms live in the same `jwt_signing_keys` table). The
  `signer_kid` column shape does not change; only the referenced key row's
  `algorithm` column value differs.
- **No delegation to a human** — a SA JWT cannot carry `sub` = usr_...;
  the `sub` claim on a SA JWT is always `svc_...`. The auth module's
  JwtSigner refuses malformed shapes.
- **No SCIM / auto-provisioning of SAs** — operators create SAs via
  CLI / admin-HTTP; no external IdP flow.

## 12. Cross-references

- `.kiro/specs/identity/design.md` §3 (principal architecture — SA is one
  of four principal types) + §4.4 (`service_accounts` table shape) + §8
  (token contracts — inter-service JWT format + JWKS + kid rotation) + §12
  (non-goals — HS256 in Wave 1a, RS256 in Wave 1c).
- `.kiro/steering/hierarchy.md` §1a (SA canonical vocabulary), §4
  (two-audience boundary — SAs are platform-plane by default, tenant-scope
  is a tightening not a plane change), §12 (service split — SAs travel
  cross-service via JWTs).
- `.kiro/steering/tenancy-columns.md` §2 (SA is one of the 8 rows
  carrying `application_id` directly), §3 (SA row's `tenant_id` uses the
  cascade rules), §5 (forbidden columns — SA carries none of them).
- `modules/identity/blueprints/identity/` — the credential substrate for
  HUMAN principals; SAs deliberately do NOT reuse this.
- `modules/identity/blueprints/platform-user/` — the sibling Wave 1a
  substrate that governs the human operators who CRUD service accounts.
- `modules/identity/README.md` — module tier index.
- `identity/auth` (Wave 3) — the module that composes over this substrate
  to issue + verify JWTs (bridges `ServiceAccountJwtIssuer` to
  `JwtSigner` + serves the JWKS endpoint).
- `modules/platform/blueprints/application/` — the parent that SAs bind
  to via `application_id`.

## 13. Migration + rollout notes

- Depends on `foundation` (base infrastructure — HasUlids, HasMetadata,
  HasActivityLog, HasAudit) + `compliance` (retention windows) +
  `application` (the parent `applications` table).
- No existing rows to migrate — from-scratch Day-1 build.
- Extended by `auth` (Wave 3) which composes `ServiceAccountJwtIssuer`
  onto the `JwtSigner` service.
- The FIRST SA (per environment) is created by an ops-authored seeder,
  NOT by a super_admin's UI action — because the UI itself may need a SA
  to make the first inter-service call. Bootstrap sequence: seed one
  `internal-bootstrap` SA per Application → wire its secret via Doppler
  → use its JWT to reach the platform admin API and provision more.
- `jwt_signing_keys` must have at least one enabled row (kid = `default-
  hs256`) at boot; `identity/auth`'s seeder ensures this. Refuse SA
  creation before that seeder runs.
- Health probe `service-account-hs256-key-configured` refuses production
  boot if no signer kid exists.
