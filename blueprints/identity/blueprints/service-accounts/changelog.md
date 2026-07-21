# service-accounts — changelog

## [Unreleased] — Wave 1a inception

**Blueprint-only. No code yet.**

Initial blueprint authoring for the `service-accounts` module — the machine
credential substrate that carries inter-service authentication for every
Stackra Application. Codifies the design.md §3 (principal architecture)

- §4.4 (`service_accounts` table shape) + §8 (token contracts) decisions locked
  in the identity spec.

### Structural

- `ServiceAccount` model authored — machine credential row, one row per named
  machine integration. Bound to ONE Application via `application_id` FK
  (RESTRICT). Optionally tenant-scoped via `tenant_id` FK (CASCADE) for
  tenant-specific integrations.
- Table `service_accounts` — 12 credential + audit columns + soft-delete
  substrate. Carries `application_id` directly (one of the 8 rows in
  `.kiro/steering/tenancy-columns.md` §2). `tenant_id` cascades through the
  tenant's own `application_id` — enforced by the observer.
- Prefixed ULID `svc_...` as primary key. Prefix registered in
  `shared/foundation/data/ulid-prefixes.json` in the same commit as this
  blueprint (companion PR).
- Composite unique on `(application_id, name)` — SA names are unique within an
  Application; the same name may exist on different Applications' SAs.
- `signer_kid` links to `auth::jwt_signing_keys.kid`. Each SA holds its OWN kid
  so per-account revocation is isolated. Multiple SAs MAY share a kid at
  operator discretion, but only within the same Application.
- Secret storage: bcrypt-hashed rotation secret in `secret_hash` (cost 12).
  Plaintext returned ONCE at creation + rotation; never retrievable again.
- Mandatory rotation: `expires_at` column (nullable — null = never expires,
  discouraged), default TTL 90 days set at creation + every rotation.
- No `identity_id` — SAs are NOT tied to human identities. Pure machine
  principals.

### Contributions

- **9 events** — every SA lifecycle transition (created, enabled, disabled,
  deleted, secret rotated, secret rotation scheduled, JWT issued, usage detected
  after dormancy, expired). All payloads readonly VOs; every dispatch
  after-commit.
- **5 jobs** — RotateServiceAccountSecretJob (on-demand + scheduled),
  NotifyRotationDueJob (weekly warning), PurgeExpiredServiceAccountsJob (daily
  04:00 UTC), UpdateLastUsedTimestampJob (batched async writes),
  DetectDormantServiceAccountJob (weekly Sunday 06:00 UTC).
- **5 notifications** — created, secret rotation due (14-day warning), secret
  expired without rotation (SA disabled), dormant (30-day silence), suspicious
  activity (high failure rate / unusual IP).
- **9 Artisan commands** — create, list, describe, rotate, disable, enable,
  delete, test-jwt (issue a test JWT + display decoded), audit-usage (usage
  report).
- **2 validation rules** — valid_service_account_name (alphanumeric + hyphens +
  underscores, max 128 chars, unique per Application), valid_kid_format (uuid or
  opaque string per config).
- **1 cast** — ServiceAccountStatus (enum: pending / active / disabled /
  expired).
- **3 middleware** — service_account.audit (heavy audit stamping,
  correlation_id, machine-context tags), service_account.verify_jwt (composes
  auth::JwtVerifier + SA state checks), service_account. enforce_scope (rejects
  `app`/`tid` claim mismatches against request headers).
- **8 bindings** — ServiceAccountRepository, ServiceAccountProvisioner,
  SecretRotator, ServiceAccountJwtIssuer (bridges to auth::JwtSigner),
  RotationSchedulerService, DormantAccountDetector, ServiceAccountFingerprinter
  (IP/UA correlation for anomaly detection).
- **1 policy** — ServiceAccountPolicy (7 abilities, all on the platform_admin
  guard).
- **11 permissions** — every ability on the `platform_admin` guard; seeded
  across super_admin, security, ops, and dpo (platform_admin roles from
  platform-user).

### Compliance surface

- **SOC 2 CC6.1** — every machine action correlated to its identity via
  `service_account.audit` middleware writing (activity_log + correlation_id +
  jti + IP + UA + duration_ms).
- **SOC 2 CC7.2** — dormant credential detection (30d silence → notification) +
  suspicious activity detection (novel IP + rate spike → notification).
- **NIST SP 800-131A** — minimum HS256 key length 32 bytes. Enforced at key
  creation by the `auth::JwtSigningKey` seeder, not this module — documented
  here in the compliance evidence.
- **OWASP ASVS V6** — service account key rotation (mandatory `expires_at`),
  revocation (soft-disable + kid disable), audit trail (every request logged).

### HTTP surface

- **8 platform-plane routes** on `/api/v1/platform/service-accounts/*` (all
  `platform_admin` guard).
- **1 unauthenticated route**: `POST /api/v1/service-accounts/token` — bcrypt
  secret → HS256 JWT exchange. Rate-limited aggressively.
- **NO tenant-plane routes** — tenants cannot see or manage service accounts.
  Cross-tenant machine access lives entirely on the platform plane.

### Boundaries

- Service accounts NEVER interactively authenticate. No MFA, no email
  verification, no password reset, no session lifecycle. The token- exchange
  endpoint is the sole credential presentation path.
- Service accounts NEVER reference `identity_id`. Zero coupling to the human
  identity graph. Distinct principal class per design.md §3.
- Service accounts NEVER cross Applications. `application_id` is immutable after
  creation; PATCH refuses to change it.
- Service accounts optionally scope to `tenant_id`, but only within their own
  `application_id`'s tenants. Observer refuses cross- Application tenant scope.

### Known blueprint deviations from the design spec

The blueprint stays faithful to design.md §4.4 (SA table shape) and §8.2
(inter-service JWT contract). Two pragmatic additions that go slightly beyond
the spec:

1. **`last_used_at` + `last_used_ip` columns** — not enumerated in design.md
   §4.4, added here to power dormant credential detection (§9) + IP-based
   anomaly correlation (§10). Written async via `UpdateLastUsedTimestampJob` to
   keep the hot request path fast.
2. **`status` enum column** — design.md §4.4 shows `is_enabled` boolean only.
   The blueprint adds a computed status enum on top of `is_ enabled` +
   `expires_at` so wire projections + list surfaces have a single categorical
   status field. Values: `pending` (created but never used) / `active`
   (enabled + not expired + used within dormancy window) / `disabled`
   (is_enabled=false) / `expired` (expires_at < now()).

Both additions preserve every design invariant (application binding, tenant
scoping, kid-per-SA, mandatory rotation) and simply materialise the flows
described in prose.

### Compatibility

- Depends on `foundation`, `compliance`, `application`.
- No existing rows to migrate — from-scratch Day-1 build.
- Extended by `auth` (Wave 3) which composes `ServiceAccountJwtIssuer` onto the
  module's `JwtSigner` service; the auth module's `jwt_signing_keys` table is
  the destination of the `signer_kid` FK from this module.
