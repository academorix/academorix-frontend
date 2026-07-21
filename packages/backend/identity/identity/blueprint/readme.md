# identity

Global credential substrate — one row per real human across every Stackra
Application. Wave 1a security-tier infrastructure, priority 15.

## 1. What this module owns

| Concern                       | Owned artefact                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------- |
| Global credential record      | `Identity` (email + password_hash + MFA secret + email verification + lockout state)                |
| Password policy enforcement   | `strong_password` validation rule (composes length + complexity + breach-check + history)           |
| MFA-secret encryption at rest | `MfaSecretEncryptor` (KMS / Vault / local drivers) + `EncryptedMfaSecret` cast                      |
| MFA recovery codes            | JSONB array of bcrypt-hashed codes on the Identity row; single-use, regenerable                     |
| Progressive account lockout   | `AccountLockoutPolicy` service, `identity.check_lockout` middleware, `AutoUnlockExpiredLockoutsJob` |
| Password history              | Rolling JSONB window on the Identity row; enforced by `not_in_password_history` rule                |
| Password breach intelligence  | `BreachedPasswordChecker` via haveibeenpwned k-anonymity API                                        |
| Email verification lifecycle  | `email_verified_at` + `email_verification_token_hash` + expiry; issued by `identity/auth`           |
| Password reset lifecycle      | Token-hash storage delegated to `identity/auth`; verified via `PasswordResetToken` FK               |
| GDPR erasure hold-period      | Soft-delete + 30-day configurable window before hard delete via `PurgeSoftDeletedIdentitiesJob`     |
| Credential audit trail        | `HasActivityLog` composition + `IdentityRegistered` / `PasswordChanged` / `IdentityErased` events   |

### 1.1 What this module explicitly does NOT own

- **HTTP authentication endpoints** — every login / refresh / password-reset /
  MFA-challenge endpoint lives in `identity/auth`. This module is the substrate;
  auth is the protocol layer that operates on it.
- **User provisioning** — `user::User` (per-Application projection of an
  Identity) is owned by the `identity/user` module. Identity does not know about
  tenant / application scope.
- **Session management** — Sanctum PAT issuance + revocation are `identity/auth`
  concerns. This module fires the `PasswordChanged` event, and `identity/auth`
  reacts by revoking sessions.
- **MFA challenge protocol** — TOTP/WebAuthn verification flows live in
  `identity/mfa`. This module owns the SECRET STORAGE; MFA owns the CHALLENGE.
- **Service accounts** — `identity/service-accounts` is a separate principal
  class. Service accounts do NOT reference Identity — they carry their own
  credentials in `service_accounts.secret_hash`.
- **Cross-app SSO grants** — `identity/auth` owns the grant issuance + exchange
  contract. Identity is queried during grant resolution but does not participate
  in the protocol.

## 2. Boundary: why Identity is separate from User

Identity is a **global** credential record. User is a **per-Application**
projection. One human → one Identity → many Users (one per Application they
use). This is the load-bearing invariant of design.md D1.

Concrete implications:

- A user of Sports + Marketplace has ONE Identity row and TWO User rows.
- A password change on Identity revokes ALL sessions across ALL Applications —
  because credentials are global, session revocation must be too.
- A per-Application status change (User.status = suspended on Sports) does NOT
  affect the same human's User row on Marketplace.
- A breach of the `users` table does NOT expose password hashes — those live on
  `identities`. Reciprocally, a breach of `identities` doesn't expose
  per-Application state (tenant, role, permissions).

The FK direction is **User → Identity** (users.identity_id points at
identities.id). Identity has NO outbound FKs. This one-way arrow is what makes
Identity re-usable across Applications without any per-App state leaking upward.

## 3. Compliance floors — the hardest invariant

Identity creation is gated by `CompliantAgePolicy`. The gate resolves in this
order (first hit wins, tenant setting can only TIGHTEN):

1. **US COPPA** — country_code = 'US' → floor 13 (16 CFR § 312).
2. **EU GDPR** — country_code ∈ EU list → floor from
   `compliance.gdpr.per_country[country_code].minor_age` (13–16 per member
   state).
3. **App default** — `auth.principal.min_age` (default 13).
4. **Tenant override** — `settings::get('auth.principal.min_age', $tenant)` →
   MAX(previous floor, this value).

Rejections use `IDENTITY_MINOR_UNDER_FLOOR` (422) with the applicable floor

- region in the response so the SPA can route to the parent-consent flow if the
  tenant serves under-13s legitimately (via the future `sports/athletes`
  parent-consent workflow — Wave 7).

### 3.1 Data minimisation

Identity holds credentials + dob ONLY. It does NOT hold:

- **Name, phone, address** — those live on `user::Profile` per Application.
- **Country / region** — resolved at request time from the caller's active User
  context. Identity carries no location.
- **Metadata about product usage, preferences, roles** — all per-Application.

The rationale: Identity outlives every Application-scoped state. A user leaving
Sports (User erased) but retaining Marketplace (User active) keeps their
Identity intact. If Identity held any per-Application PII, we'd have to
erase-partially, and partial erasure creates data-integrity headaches.

## 4. The credential surface — what a downstream module can touch

Only the following operations are safe from a caller's perspective. Every other
read / write is a bug.

| Operation                      | Entry point                                         | Caller                                                    |
| ------------------------------ | --------------------------------------------------- | --------------------------------------------------------- |
| Register a new Identity        | `IdentityRepository::create(RegisterIdentityInput)` | `identity/auth::RegisterAction`                           |
| Verify a password              | `Identity->verifyPassword($plain)`                  | `identity/auth::LoginAction`                              |
| Record a successful login      | `Identity->markLoginSuccess()`                      | `identity/auth::LoginAction`                              |
| Record a failed login          | `Identity->markLoginFailure()`                      | `identity/auth::LoginAction`                              |
| Verify a TOTP code             | `Identity->verifyTotp($code)`                       | `identity/mfa::VerifyTotpAction`                          |
| Consume a recovery code        | `Identity->consumeRecoveryCode($code)`              | `identity/mfa::VerifyRecoveryCodeAction`                  |
| Change password (with current) | `Identity->changePassword(ChangePasswordInput)`     | `identity/auth::ChangePasswordAction`                     |
| Reset password (via token)     | `Identity->resetPassword(ResetPasswordInput)`       | `identity/auth::CompletePasswordResetAction`              |
| Enrol MFA                      | `Identity->enrollMfa(EnrollMfaInput)`               | `identity/mfa::EnrollMfaAction`                           |
| Disable MFA                    | `Identity->disableMfa()`                            | `identity/mfa::DisableMfaAction`                          |
| Regenerate recovery codes      | `Identity->regenerateRecoveryCodes()`               | `identity/mfa::RegenerateRecoveryCodesAction`             |
| Mark email verified            | `Identity->markEmailVerified()`                     | `identity/auth::VerifyEmailAction`                        |
| Erase an Identity (GDPR)       | `IdentityRepository::erase($id, Reason)`            | `identity:erase` command / compliance officer HTTP action |

Every entry point above is idempotent, transactional, and emits the matching
event after-commit. Callers NEVER read or mutate the raw table.

### 4.1 What NEVER escapes this module

- `Identity.password_hash` — server-side comparison only, never returned on the
  wire.
- `Identity.mfa_secret_encrypted` — decrypted in-memory during verification,
  never persisted anywhere except the KMS-encrypted at-rest column.
- `Identity.mfa_recovery_codes_hashed` — individual codes shown ONCE at
  regeneration, then only as bcrypt hashes.
- `Identity.email_verification_token_hash` — SHA-256 of the outstanding token;
  plaintext token exists only in the emailed link.
- `Identity.password_history_hashed` — hashes only; never plaintext.

These fields are marked in the model's `$hidden` array so accidental JSON
serialisation cannot leak them, and they're classified `regulated_secret` in
`data-classes.json` so the audit-log redactor also drops them.

## 5. Lockout — progressive backoff

The lockout policy is designed to punish attackers proportionally to their
persistence while never permanently locking out legitimate users.

- `failed_attempts_count` increments on every mismatch. Sliding window is
  `identity.lockout.window_minutes` (default 15) — attempts older than the
  window are rolled off by `AutoUnlockExpiredLockoutsJob`.
- On reaching `identity.lockout.max_failed_attempts` (default 5), the row is
  locked. `locked_until = now() + base_lockout_minutes` (default 15).
- With `identity.lockout.progressive_backoff = true` (default), consecutive
  lockouts within a rolling 1-hour window double the duration each time. 15min →
  30min → 60min → 120min, capped at `max_lockout_minutes` (default 720, i.e. 12
  hours).
- On successful login, `failed_attempts_count = 0` and `locked_until = NULL`.

The `identity.check_lockout` middleware rejects requests for locked identities
BEFORE the password comparison runs. This preserves login timing consistency
across locked / unlocked / unknown-email cases — no side-channel enumeration is
possible from response time alone.

## 6. Erasure — GDPR-compliant delete

Erasure is a two-phase process to satisfy audit-trail requirements while still
meeting the 30-day statutory window:

- **Phase 1: soft delete.** `identity:erase` (CLI) or
  `DELETE /api/v1/platform/identities/{id}` (HTTP) marks `deleted_at = now()`.
  The Identity row keeps its hashed credentials + PII for the hold-period so
  compliance queries for "what did user X do" resolve historical audit trails
  correctly.
- **Phase 2: hard delete.** `PurgeSoftDeletedIdentitiesJob` (daily 04:00 UTC)
  enumerates rows where `deleted_at + erasure_hold_days < now()`, verifies no
  inbound FK remains (User / PlatformUser cascade must have fired first), and
  hard-deletes the row. Fires `IdentityErased(erasure_phase='hard_delete')`.

The hold-period is configurable per row via a metadata flag
(`retention_hold_extended_until`) that compliance officers can set when a
request is under legal dispute. See `retention.json` for the extension protocol.

### 6.1 Cascade order

The correct cascade for a full-lifecycle erasure:

1. **Application-scoped state** (roles, sessions, permissions) — cleared by
   `identity/auth` when it receives the User erasure.
2. **User** (per-Application projection) — deleted from `users`; cascades
   `tenant_members` + downstream domain rows.
3. **PlatformUser** if any — deleted from `platform_users`.
4. **MFA challenges + reset tokens + verification tokens** — cascade via FK ON
   DELETE CASCADE.
5. **Identity** — hard-deleted last, after every inbound row is gone.

If step 5 refuses (inbound row remained), `PurgeSoftDeletedIdentitiesJob` emits
`stackra.identity.erasure.blocked` and writes a compliance-alert audit entry
naming the blocker. Ops investigates the cascade path.

## 7. MFA — how the secret becomes durable

MFA enrolment is a two-round protocol. The plaintext TOTP secret NEVER touches
durable storage.

1. **Round 1 — preview.** `POST /api/v1/auth/mfa/enroll/preview` generates a
   fresh 160-bit secret + returns it once (base32 + otpauth:// URI for QR
   rendering). The secret is HELD IN MEMORY only.
2. **Round 2 — confirm.** `POST /api/v1/auth/mfa/enroll` submits the secret back
   with a valid TOTP code proving the user scanned it. The server encrypts the
   secret via `MfaSecretEncryptor::encrypt()` and persists the ciphertext to
   `Identity.mfa_secret_encrypted`.

At every subsequent MFA challenge, `MfaSecretEncryptor::decrypt()` returns the
plaintext for the constant-time TOTP comparison. The plaintext lives only in a
single stack frame; PHP's zeroing on scope exit clears it.

For KMS-key rotation, `identity:rotate-mfa-secret` re-encrypts the ciphertext
under the current data key WITHOUT decrypting the TOTP secret into a persistent
variable — it decrypts and re-encrypts inline inside
`MfaSecretEncryptor::rotate()`.

### 7.1 Recovery codes

10 codes generated at enrolment; each is 10 characters (base32, ~48 bits of
entropy). Codes are bcrypt-hashed individually and stored as a JSONB array on
the same Identity row.

Consuming a code (`Identity->consumeRecoveryCode($code)`) constant-time compares
against every hash in the array, removes the matching entry in the same
transaction as the login. Single-use by construction — re-submitting a consumed
code returns `RECOVERY_CODE_INVALID`.

Regenerating codes purges the entire array and issues 10 fresh codes. The
plaintext codes are returned ONCE to the caller, then only the bcrypt-hashed
forms remain.

## 8. Session revocation on credential mutation

Every password change or MFA disable fires an event that `identity/auth` listens
for. The listener revokes every active Sanctum PAT for every User row that
references the Identity — across every Application the human uses.

This is a load-bearing invariant. If a human's Identity is compromised, they
need one action ("change my password") to lock every attacker session across
every Application. The event chain:

```
Identity->changePassword(...) [tx]
    ↓  (after-commit)
Fires: identity::PasswordChanged
    ↓
identity/auth::RevokeAllActiveSessions listener
    ↓
UPDATE personal_access_tokens
SET revoked_at = now()
WHERE tokenable_type = User AND tokenable_id IN (
    SELECT id FROM users WHERE identity_id = <identity_id>
)
```

The listener is idempotent and safe under retry.

## 9. HTTP surface — none owned

This module ships no `routes` file. Every authentication endpoint lives in
`identity/auth`. See `routes.json` for the enumerated surface owned by that
module (login, refresh, MFA verify, password reset, cross-app grant, plus the
platform-admin identity CRUD).

Access to Identity from operator surfaces is via:

- **Artisan commands** — `identity:list`, `identity:describe`,
  `identity:unlock`, `identity:force-password-reset`, `identity:erase`,
  `identity:rotate-mfa-secret`, `identity:purge-expired-tokens`.
- **The platform-admin HTTP surface** (owned by identity/auth) —
  `GET /api/v1/platform/identities`,
  `POST /api/v1/platform/identities/{id}/unlock`, etc.

Both surfaces flow through `IdentityPolicy` (see `policies.json`) with guard
`platform_admin`.

## 10. What this module does NOT do (non-goals)

Cross-referenced with design.md §12:

- **No OAuth server** — deferred to `identity/oauth/` (Wave 1c).
- **No SAML/OIDC federation** — deferred to `identity/sso/` (Wave 1c).
- **No SCIM auto-provisioning** — deferred to `identity/sso/`.
- **No passwordless-first flow** — WebAuthn is a second factor only in Wave 1a.
  Passwordless primary is reconsidered in Wave 1c.
- **No RS256/ES256 JWT signing** — HS256 with shared secrets is sufficient for
  the initial single-cluster deployment. Upgrade to asymmetric with Wave 1c when
  public federation lands.
- **No Identity merging** — two Identity rows on the same human (e.g. registered
  twice with different emails) stay separate. Merging is a manual operations
  task with explicit consent, deferred to Wave 4.
- **No shared password storage across Identities** — each Identity has its own
  hash. Cross-app SSO is grant-based (owned by `identity/auth`), not
  credential-shared.
- **No delegated authentication** — impersonation ("support agent acts as user")
  lands in `access/delegation` (Wave 1b), NOT here.
- **No HTTP routes owned directly** — this module is a substrate; every route
  lives in `identity/auth` or downstream.
- **No tenant / application scope on the Identity row** — global by design (D1
  lock).
- **No scope-substrate integration** — Identity is not a configuration consumer;
  the `scope` module never touches `identities`.

## 11. Cross-references

- `.kiro/specs/identity/design.md` — the locked spec this blueprint materialises
  (D1: Identity vs User split; D2: Tenants per Application; D3: JWT contract).
- `.kiro/steering/hierarchy.md` §3 — Identity vs User split canonical
  vocabulary.
- `.kiro/steering/tenancy-columns.md` — column-attribution contract; Identity is
  explicitly on the "NO application_id, NO tenant_id" side.
- `modules/shared/blueprints/localization/` — canonical style reference (this
  blueprint mirrors its file structure).
- `modules/identity/README.md` — module tier index; explains why identity sits
  separate from platform.
- `identity/auth` — the protocol layer that operates on this substrate (Wave 3).
- `identity/mfa` — the challenge layer that verifies the MFA secret this
  substrate stores (Wave 2).
- `identity/user` — the per-Application projection that references
  `identities.id` via `users.identity_id`.
- `identity/platform-user` — the platform-staff principal that reuses this
  substrate.
- `identity/service-accounts` — a SEPARATE principal class; does not reference
  Identity.

## 12. Migration + rollout notes

- Depends on `foundation` (base infrastructure — HasUlids, HasMetadata,
  HasActivityLog) and `compliance` (CompliantAgePolicy + regime configs).
- No existing rows to migrate — this is a from-scratch table shipping with the
  identity-service Day-1 build.
- Extended by `user`, `platform-user`, `mfa`, `auth`, `service-accounts`. All
  those modules land after `identity` in the boot order (priorities 18–25).
- The MFA-secret encryptor MUST be configured to `kms` or `vault` in production;
  the `local` driver's health probe refuses to load when `APP_ENV=production`.
- The initial deployment requires KMS access (or Vault) even before the first
  user exists — `identity-kms-reachable` is a critical health probe.
