# mfa — changelog

## [Unreleased] — Wave 1a inception

**Blueprint-only. No code yet.**

Initial blueprint authoring for the `mfa` module — the MFA challenge +
verification protocol layer that composes on top of identity/identity's
credential substrate. Codifies §7.2 (MFA challenge flow) + §12 (non-goals — no
passwordless-first, no SMS OTP) of `.kiro/specs/identity/design.md` and pins the
enforceable surface for the code phase that follows.

### Structural

- `WebauthnCredential` model authored — global aggregate (belongs to Identity),
  stores FIDO2 credential metadata + monotonic sign_count for replay-protection.
- Table `webauthn_credentials` — 13 columns covering credential identity
  (credential_id bytea + public_key COSE bytea + attestation_format),
  authenticator metadata (aaguid + transports + backup_eligible + backup_state),
  lifecycle timestamps + soft-delete substrate.
- Prefixed ULID `wac_` as primary key. Prefix registered in
  `shared/foundation/data/ulid-prefixes.json` in the same commit as this
  blueprint (companion PR).
- Composite index on `(identity_id, disabled_at)` for the hot lookup path
  (list-active-credentials-for-Identity).
- No `tenant_id` / `application_id` — WebAuthn credentials are global, matching
  the substrate they extend (per tenancy-columns.md).
- Global unique index on `credential_id` — duplicate registration is a
  compliance signal (either browser or authenticator misbehaving).

### Contributions

- **14 events** — every MFA lifecycle transition (enrolment preview → confirm →
  fail, challenge issued → succeeded / failed, credential registered / renamed /
  disabled / deleted, recovery-code consumed / regenerated / low, cumulative MFA
  disabled). All payloads readonly VOs; every dispatch after-commit.
- **3 jobs** — PurgeUnconfirmedEnrollmentsJob (5-min cadence — evicts ephemeral
  Redis envelopes), NotifyLowRecoveryCodesJob (nightly — sends reminders to
  Identities under threshold), CleanupDisabledWebauthnCredentialsJob (daily —
  hard-deletes past-90-day disabled credentials).
- **5 notifications** — mfa-enrolled, mfa-disabled, recovery-code-consumed,
  low-recovery-codes, suspicious-activity. Categories seeded with
  transactional_required consent tier where applicable.
- **7 Artisan commands** — list-methods, describe-method (with --reveal-metadata
  audit-logged), force-disable, regenerate-recovery-codes,
  list-webauthn-credentials, purge-unconfirmed, audit-suspicious-activity.
- **4 validation rules** — valid_totp_code, valid_recovery_code_format,
  valid_webauthn_credential_id, valid_device_name.
- **2 casts** — WebauthnCredentialId (base64url encoding for wire),
  WebauthnPublicKey (COSE decode).
- **2 middleware** — mfa.require_challenge_complete (session-level MFA
  enforcement for required-for-roles principals), mfa.require_recent_challenge
  (step-up gate for sensitive actions).
- **12 bindings** — the challenger family (TotpChallenger, WebauthnChallenger,
  RecoveryCodeChallenger), the enrolment family (MfaEnrollmentPreviewIssuer,
  MfaEnrollmentConfirmer, MfaDeviceRegistrar), the dispatch interface
  (MfaChallengeDispatcher — implementing the contract bound in identity/auth),
  utility generators (RecoveryCodeGenerator, TotpSecretGenerator), the WebAuthn
  verifiers (WebauthnAssertionVerifier, WebauthnAttestationVerifier), and the
  anomaly detector (MfaSuspiciousActivityDetector).

### Co-ownership boundary

Locked between identity/identity + mfa:

- **identity/identity** owns the STORAGE substrate —
  `Identity.mfa_secret_encrypted`
  - `Identity.mfa_recovery_codes_hashed` columns, MfaSecretEncryptor service
    (KMS envelope encryption), `identity::MfaEnrolled` + `identity::MfaDisabled`
    events (fired on storage-substrate transitions), and the paired
    `EncryptedMfaSecret` + `HashedRecoveryCodes` casts.
- **mfa** (this module) owns the PROTOCOL layer — challenge dispatch, TOTP +
  WebAuthn + recovery-code verification, `webauthn_credentials` table,
  mfa::MfaChallengeIssued + Succeeded + Failed events (per-challenge lifecycle),
  enrolment preview + confirmation flow, the suspicious-activity detector, and
  the `/me/mfa/*` + `/platform/mfa/*` HTTP surface.

The `auth_mfa_challenges` table is a shared ledger — schema owned by
identity/auth (it also carries password-reset challenges + email-verification
challenges), CRUD accessed by mfa via the `MfaChallengeRepository` contract from
identity/auth.

### Compliance surface

- **NIST 800-63B AAL2** — TOTP + WebAuthn satisfy AAL2 authenticator
  requirements (§ 4.2 + § 5.1.4 + § 5.1.7 + § 5.1.8). `mfa.required_for_roles`
  (default: owner, admin, billing_manager, super_admin) enforces AAL2 for
  privileged principals.
- **FIDO Alliance L2** — WebAuthn attestation verification per W3C L2 spec
  (implemented via `web-auth/webauthn-lib`).
- **PCI-DSS 4.0 Req 8.5** — MFA for administrative + billing access, enforced
  via `mfa.require_challenge_complete` middleware.
- **GDPR** — data minimisation (no IP / user-agent on credentials), right to
  erasure (FK cascade on Identity hard-delete), storage limitation (90-day
  retention on disabled credentials, ephemeral Redis-only for enrolment
  previews).
- **SOC 2 CC6.1 + CC6.6 + CC7.2** — role-scoped access controls, brute-force
  protection with progressive attempts, comprehensive monitoring via health
  probes + OTel metrics.
- **ISO 27001 A.5.16 + A.5.17 + A.8.5** — full-lifecycle audit trail via
  HasActivityLog composition on WebauthnCredential.

### Security invariants

Codified across observers + tests:

- **Constant-time comparisons** — every code / assertion / recovery-code compare
  uses `hash_equals()`. The `stackra.mfa.challenge.duration_ms` histogram is
  monitored for drift between success + failure paths — any divergence signals a
  code path that leaks timing.
- **Plaintext-never-persists** — TOTP secret plaintext lives in-memory during
  enrolment preview (Redis envelope, 5-min TTL); never persisted to Postgres
  before round-2 confirmation. Recovery-code plaintext is emitted-once at
  enrolment / regeneration + never retrievable again after the response.
- **Sign_count monotonic** — WebAuthn assertions with a sign_count less than or
  equal to the stored value are refused; the credential is auto-deleted (or
  disabled per feature flag) as a REPLAY attack signal.
- **Attempts capped** — every challenge is limited to
  `config('mfa.challenge.max_attempts')` (default 3) attempts before
  invalidation; cooldown of `config('mfa.challenge.cooldown_minutes_after_max')`
  before a fresh challenge can be issued.

### Boundaries

- MFA NEVER exposes challenge-INITIATION HTTP routes directly. Those live in
  identity/auth (POST /api/v1/auth/mfa/challenge/initiate). This module owns
  only the VERIFY step.
- MFA NEVER carries tenant / application scope on WebauthnCredential —
  credentials are global via the Identity substrate.
- MFA NEVER dispatches outbound webhooks. Optional inbound webhook from the FIDO
  Alliance Metadata Service for authenticator-revocation is configurable but off
  by default.
- MFA does NOT integrate with the scope framework — WebauthnCredential is not a
  configuration consumer.
- MFA does NOT implement SMS OTP (NIST 800-63B considers SMS unfit for MFA; not
  planned).

### Compatibility

- Depends on `foundation`, `compliance`, `identity`.
- No existing rows to migrate — this is a from-scratch table shipping with the
  identity-service Day-1 build.
- Extended by (Wave 1a-1b): `auth` (dispatches challenges + issues PATs on
  success), `user` (references Identities that may have MFA enrolled),
  `platform-user` (platform-staff principals also protected by MFA per the
  required_for_roles policy).

### Known blueprint deviations from the design spec

The blueprint stays faithful to design.md §7.2 (MFA challenge flow), §10
(compliance floors), and §12 (non-goals). Two pragmatic additions that go
slightly beyond the spec:

1. **Step-up authentication (`mfa.require_recent_challenge` middleware)** — not
   explicitly enumerated in design.md but strongly implied by the PCI-DSS 4.0 +
   SOC 2 CC6.1 language. Ships gated behind the `mfa_step_up` entitlement so
   tenants who don't need it aren't taxed with the friction.
2. **Suspicious-activity detection (`MfaSuspiciousActivityDetector`)** —
   design.md leaves the anomaly-detection design open. This blueprint pins a
   specific two-threshold shape (failure count + distinct IPs within a rolling
   window) that matches the pattern identity/identity's
   `CheckForSuspiciousLoginPattern` listener uses for login failures.

Both additions preserve every design invariant (co-ownership boundary with
identity/identity, guard-namespace isolation between sanctum + platform_admin,
per-Identity attribution without cross-Application coupling) and simply
materialise the flows described in prose.
