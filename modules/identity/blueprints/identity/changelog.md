# identity — changelog

## [Unreleased] — Wave 1a inception

**Blueprint-only. No code yet.**

Initial blueprint authoring for the `identity` module — the global credential
substrate that every downstream authentication flow depends on. Codifies the
D1/D2/D3 decisions locked in `.kiro/specs/identity/design.md` and pins the
enforceable surface for the code phase that follows.

### Structural

- `Identity` model authored — global credential record, one row per real
  human across every Academorix Application (design.md D1).
- Table `identities` — nine credential + audit columns + soft-delete
  substrate. NO `tenant_id`, NO `application_id` (global by design).
- Prefixed ULID `idn_...` as primary key. Prefix registered in
  `shared/foundation/data/ulid-prefixes.json` in the same commit as this
  blueprint (companion PR).
- Composite unique on `email` under `deleted_at IS NULL` — allows a fresh
  sign-up on the same email after erasure hold-period completes.
- Password history retained as a JSONB rolling window on the Identity row —
  no separate table. History size configurable
  (`identity.password.history_size`, default 5).
- MFA secret stored envelope-encrypted (KMS/Vault/local; local dev-only). MFA
  recovery codes bcrypt-hashed inside a JSONB array on the same row.

### Contributions

- **12 events** — every credential lifecycle transition (register, verify,
  password-change, lockout, MFA enrol/disable, recovery-code regen, erasure).
  All payloads readonly VOs; every dispatch after-commit.
- **3 jobs** — PurgeExpiredResetTokensJob (5-min cadence),
  AutoUnlockExpiredLockoutsJob (1-min cadence), PurgeSoftDeletedIdentitiesJob
  (daily 04:00 UTC).
- **5 notifications** — email-verification, password-reset,
  password-changed-confirmation, account-locked, suspicious-login. Categories
  seeded with transactional_required consent tier.
- **7 Artisan commands** — list, describe (with --reveal-pii audit-logged
  unmute), unlock, force-password-reset, erase (GDPR), rotate-mfa-secret,
  purge-expired-tokens.
- **4 validation rules** — strong_password (breach-check-enabled by default),
  bcp47_locale, valid_recovery_code, not_in_password_history.
- **2 casts** — EncryptedMfaSecret (KMS-backed transparent decryption),
  HashedRecoveryCodes.
- **2 middleware** — identity.rate_limit_login (per-IP + per-email throttling
  before password check), identity.check_lockout (rejects locked identities
  before the hash comparison to preserve timing consistency).
- **2 macros** — Str::password_strength (side-effect-free scoring for live
  strength indicators), Blueprint::identity_fields (migration shorthand).

### Compliance surface

- **COPPA** — 13-year floor enforced at Identity creation via
  CompliantAgePolicy. Refused with 422 + `IDENTITY_MINOR_UNDER_FLOOR`.
- **GDPR** — per-country minor age from `compliance.gdpr.per_country`. Right
  to erasure via `identity:erase` + 30-day hold-period (configurable). Data
  minimisation: Identity holds credentials + dob only, no name / address /
  phone (those live on Profile per Application).
- **NIST 800-63B** — password policy defaults align (min length 12, no
  mandatory rotation by age, no mandatory symbol, breach check against
  haveibeenpwned).
- **PII redaction** — email + dob are `restricted`. Unmute permission
  `platform.identity.view.pii` writes an audit-log entry on every use.

### Boundaries

- Identity NEVER exposes HTTP routes directly. Every endpoint (login, refresh,
  MFA challenge, password reset) lives in `identity/auth` (Wave 3 module).
- Identity NEVER carries tenant / application scope. Downstream aggregation
  lives on the referencing table (`users.identity_id`, `platform_users.identity_id`).
- Identity NEVER dispatches outbound webhooks. See webhooks.json rationale.
- Identity does NOT integrate with the scope framework — Identity is not a
  configuration-consumer.

### Compatibility

- Depends on `foundation`, `compliance`.
- No existing rows to migrate — this is a from-scratch table shipping with
  the identity-service Day-1 build.
- Extended by (Wave 1a-1b): `user`, `platform-user`, `mfa`, `auth`,
  `service-accounts`.

### Known blueprint deviations from the design spec

The blueprint stays faithful to design.md §4 (data model), §7 (auth flows
— referenced but owned by identity/auth), §10 (compliance floors), and §12
(non-goals). Two minor pragmatic additions that go slightly beyond the spec:

1. **`last_failed_at` column** — not enumerated in design.md §4.1, added here
   to power the sliding-window failed_attempts_count reset. Complements
   `failed_attempts_count` and is required for correct progressive-backoff
   evaluation.
2. **`email_verification_token_hash` + `email_verification_expires_at`** —
   design.md §4.1 mentions email_verified_at only. The other two columns are
   necessary implementation details for a self-contained verification lifecycle
   (per §7.5's password-reset flow shape, applied consistently to email
   verification).

Both additions preserve every design invariant (global scope, no cross-scope
FK, no PII redaction changes) and simply materialise the flows described in
prose.
