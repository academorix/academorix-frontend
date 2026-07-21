# mfa

Multi-factor authentication challenge protocols. Wave 1a security-tier
infrastructure, priority 20 — sits above identity/identity (priority 15, storage
substrate) and extends into identity/user + identity/platform-user +
identity/auth (protocol callers, priorities 18-25).

## 1. What this module owns

| Concern                                              | Owned artefact                                                                                                                                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Challenge dispatch (TOTP + WebAuthn + recovery-code) | `MfaChallengeDispatcher` (implements identity/auth's `MfaChallengeDispatcherInterface`)                                                                                                                                   |
| TOTP verification protocol                           | `TotpChallenger` (RFC 6238; wraps `pragmarx/google2fa` with constant-time compare + window drift tolerance)                                                                                                               |
| WebAuthn attestation + assertion                     | `WebauthnAssertionVerifier` + `WebauthnAttestationVerifier` (wraps `web-auth/webauthn-lib` — W3C L2 spec compliant)                                                                                                       |
| Recovery-code protocol                               | `RecoveryCodeChallenger` (constant-time bcrypt compare + atomic single-use consumption via identity/identity's `valid_recovery_code` rule)                                                                                |
| WebAuthn credential registrations                    | `WebauthnCredential` model + `webauthn_credentials` table                                                                                                                                                                 |
| Enrolment flow (two-round: preview → confirm)        | `MfaEnrollmentPreviewIssuer` + `MfaEnrollmentConfirmer` + `MfaDeviceRegistrar`                                                                                                                                            |
| Step-up middleware                                   | `mfa.require_challenge_complete` + `mfa.require_recent_challenge`                                                                                                                                                         |
| Suspicious-activity detection                        | `MfaSuspiciousActivityDetector` + `MfaChallengeSuspiciousActivityNotification`                                                                                                                                            |
| Self-service HTTP surface                            | `/api/v1/me/mfa/*` (tenant) + `/api/v1/platform/mfa/*` (platform-admin support / emergency)                                                                                                                               |
| Recovery-code generation                             | `RecoveryCodeGenerator` (10 codes × 10 chars from Crockford base32 alphabet, ≈ 50 bits entropy per code)                                                                                                                  |
| TOTP secret generation                               | `TotpSecretGenerator` (160-bit random secret, base32-encoded)                                                                                                                                                             |
| Lifecycle events                                     | 14 events covering enrolment (preview / confirmed / failed), challenge (issued / succeeded / failed), recovery-codes (consumed / regenerated / low), and WebAuthn credentials (registered / renamed / disabled / deleted) |

### 1.1 What this module explicitly does NOT own

- **MFA secret storage at rest** — `Identity.mfa_secret_encrypted` +
  `Identity.mfa_recovery_codes_hashed` are columns on the `identities` table
  owned by identity/identity. This module reads / writes them through
  identity/identity's `MfaSecretEncryptor` service + the on-Identity JSONB
  array; it does NOT own the storage schema or the KMS binding.
- **The challenge ledger table** — `auth_mfa_challenges` is owned by
  identity/auth (it's the challenge substrate for every authentication flow, not
  just MFA). This module dispatches CREATE / VERIFY / EXPIRE operations against
  that table via identity/auth's `MfaChallengeRepository` but does NOT own its
  schema.
- **Login-time challenge initiation** —
  `POST /api/v1/auth/mfa/challenge/initiate` is owned by identity/auth. This
  module owns only the verify step
  (`POST /api/v1/me/mfa/challenge/{id}/verify`).
- **Sanctum PAT issuance on challenge success** — identity/auth issues the PAT
  after this module returns a MfaChallengeSucceeded event.
- **Password lifecycle** — password changes / resets / breach checks live in
  identity/identity and identity/auth. This module never touches the password
  hash; it just enforces MFA is present in the same session.
- **Cross-app SSO grants** — identity/auth owns cross-app grant issuance +
  exchange. This module has no cross-app scope; every challenge is bound to a
  single Identity globally.

## 2. Co-ownership — the identity ↔ mfa boundary

MFA state is genuinely shared between two modules. The boundary:

| identity module owns                                         | mfa module owns                                             |
| ------------------------------------------------------------ | ----------------------------------------------------------- |
| `Identity.mfa_secret_encrypted` column + KMS envelope        | Challenge / verification protocols against that secret      |
| `Identity.mfa_recovery_codes_hashed` JSONB array             | Recovery-code generation / consumption protocol             |
| `MfaSecretEncryptor` service (encrypt / decrypt / rotate)    | Callers of that service (challenge verification + rotation) |
| `identity::MfaEnrolled` / `identity::MfaDisabled` events     | `mfa::MfaEnrollmentConfirmed` / `mfa::MfaDisabled` events   |
| `EncryptedMfaSecret` + `HashedRecoveryCodes` casts           | `WebauthnCredentialId` + `WebauthnPublicKey` casts          |
| `valid_recovery_code` rule (validates + consumes atomically) | `valid_recovery_code_format` rule (format-only)             |
| The `identities` table + its MFA columns                     | The `webauthn_credentials` table                            |

The rule of thumb: **identity owns the substrate; mfa owns the protocol**. When
in doubt, ask "does this concept survive across a full-tenant erasure where
every application-scoped state is wiped?" — if yes, it's identity's; if no, it's
mfa's.

Two events with the same NAME:

- `identity::MfaDisabled` fires when the storage substrate transitions
  (Identity.mfa_secret_encrypted goes to null OR the recovery-code array is
  purged). Fires early — at the moment the DB column mutates.
- `mfa::MfaDisabled` fires when the CUMULATIVE MFA posture becomes zero (no TOTP
  secret AND no active WebAuthn credentials). Fires late — possibly after
  several credential-disable steps stitched together.

Both fire in the same request when a tenant caller does `DELETE /me/mfa/totp`
and had no WebAuthn credentials. Downstream consumers should subscribe to the
mfa one (cumulative signal); the identity one is for the storage-layer listeners
only.

## 3. Challenge protocols

Three challenge protocols. Every challenge follows the same three-step shape:
issue (create a row in `auth_mfa_challenges`), verify (POST /verify with the
proof), consume (atomically mark the row consumed + issue the PAT).

### 3.1 TOTP (RFC 6238)

Standard time-based OTP. Client-side app (Google Authenticator, Authy,
1Password, iCloud Keychain, …) computes a 6-digit code from a shared secret +
the current 30-second period. Server verifies by computing the same code +
comparing in constant time.

Defaults (see `config('mfa.totp.*')`):

- 6-digit code, 30-second period, SHA1 HMAC — RFC 6238 canonical shape.
- Window ±1 period for clock-skew tolerance (accepts previous, current, next 30s
  codes → 90s window).
- 160-bit shared secret (RFC 6238 recommended), base32-encoded.

Enrolment is a **two-round protocol** so the plaintext secret never reaches
durable storage until the user proves possession:

1. **Round 1 — preview.** `POST /api/v1/me/mfa/totp/enroll/preview` generates a
   fresh secret, stores it inside a signed Redis envelope under
   `mfa:enroll:preview:{session_id}` (5-minute TTL), returns
   `TotpEnrollmentPreview` DTO containing:
   - `totp_secret` (base32, echoed for the browser's QR component)
   - `totp_uri` (`otpauth://totp/Stackra:<fingerprint>?secret=<secret>&…`)
   - Issued + expiry timestamps
2. **Round 2 — confirm.** `POST /api/v1/me/mfa/totp/enroll` submits back the
   secret + a valid TOTP code proving the user scanned it. Server verifies the
   code against the ephemeral secret + persists the ciphertext to
   `Identity.mfa_secret_encrypted` via identity/identity's encryptor. Recovery
   codes generated + hashed atomically. `RecoveryCodesDownload` DTO returned
   ONCE.

If round 2 never runs, `PurgeUnconfirmedEnrollmentsJob` (every 5 minutes) evicts
the envelope — the plaintext secret was never persisted to Postgres, so nothing
needs cleaning up beyond the Redis key.

### 3.2 WebAuthn (FIDO2, W3C Level 2)

FIDO2 credentials — either platform authenticators (Face ID, Touch ID, Windows
Hello) or roaming hardware keys (YubiKey, Titan Security Key). Used as a
**second factor only** in Wave 1a per design.md §12 non-goals (passwordless-
first is deferred to Wave 1c).

Enrolment is also two-round, mirroring the WebAuthn spec:

1. **Round 1 — options.** `POST /api/v1/me/mfa/webauthn/register/options`
   returns `WebauthnRegisterOptions` DTO (challenge nonce, RP info, user info,
   already-registered credentials to exclude). Browser passes this to
   `navigator.credentials.create()`.
2. **Round 2 — register.** `POST /api/v1/me/mfa/webauthn/register` submits the
   attestation response. Server verifies attestation (format-specific verifier
   for `packed` / `fido-u2f` / `android-key` / `apple` / `tpm` / `none`) +
   inserts a `WebauthnCredential` row. `WebauthnCredentialRegistered` event.

Verification (login-time OR step-up) is the standard WebAuthn assertion flow:
issue a 32-byte challenge, browser signs it with the private key on-device,
server verifies against the stored public key. Server also enforces the
**sign_count monotonic invariant** — the observer refuses any assertion that
carries a `sign_count` less than or equal to the stored value. A backward-going
counter is a REPLAY ATTACK signal (per W3C spec § 7.2 step 21) — the credential
is auto-deleted (when `mfa.sign_count_replay_hard_delete` is on) OR auto-
disabled (when off), + a critical audit entry is logged.

### 3.3 Recovery codes

Fallback for when the primary factor is unavailable (lost phone, drained
battery, lost hardware key). Ten codes generated at enrolment; each is 10
characters from a Crockford base32 alphabet (0-9 + A-Z minus I/L/O/U) ≈ 50 bits
of entropy per code.

Codes are bcrypt-hashed individually and stored as a JSONB array on the Identity
row (owned by identity/identity). Consuming a code:

1. Constant-time compare the plaintext code against EVERY hash in the array
   (constant-time is critical — a linear-scan that short-circuits on match leaks
   which codes are consumed via timing).
2. Atomically remove the matching entry from the JSONB in the same transaction
   as the login.
3. Fire `MfaRecoveryCodeConsumed` (which the notification listener consumes)
   - `MfaBackupCodeCountLow` if the remaining count fell below the threshold.

Regeneration purges the entire array + issues 10 fresh codes; plaintext returned
ONCE. The download endpoint (`POST /me/mfa/recovery-codes/download`) re-emits
the CURRENT unconsumed codes ONCE MORE, audit-logged as data-egress.

## 4. Step-up authentication

Sensitive-write actions (password change, MFA disable, recovery-code regen,
credential delete) are gated by `mfa.require_recent_challenge` middleware. The
middleware reads the session's `last_mfa_challenge_at`; refuses when the last
challenge is older than `config('mfa.step_up.sensitive_action_ttl_minutes')`
(default 5 minutes).

Rejection returns 403 `MFA_CHALLENGE_TOO_STALE` with a `step_up_url` pointing at
the challenge-initiate endpoint. The SPA transparently prompts, verifies,
retries the original request.

This closes the "stolen session cookie" attack — even with a valid Sanctum PAT,
disabling MFA or regenerating codes requires proving current possession of the
primary factor. Gated behind the `mfa_step_up` entitlement (enterprise-only
default) because the UX friction is nontrivial.

## 5. Suspicious-activity detection

`MfaSuspiciousActivityDetector` maintains a per-Identity rolling window of
`MfaChallengeFailed` events in Redis
(`mfa:suspicious_activity:window:{identity_id}`). On every fresh failure the
detector reads the window and evaluates two thresholds:

- **Failure count**: `config('mfa.suspicious_activity.failure_threshold')`
  (default 5) failures within `config('mfa.suspicious_activity.window_minutes')`
  (default 15).
- **Distinct IPs**: `config('mfa.suspicious_activity.distinct_ips_threshold')`
  (default 2) — reduces false positives from a legitimate user retyping from one
  desk.

When both cross, dispatch `MfaChallengeSuspiciousActivityNotification` (mail to
the caller + a redacted variant to the platform-security-alerts channel).
Debounced 4 hours per Identity so an active attack doesn't spam the user.

## 6. Entitlements consumed

- `mfa_totp` — TOTP enrolment endpoints (baseline, every tier)
- `mfa_webauthn` — WebAuthn enrolment endpoints (team+)
- `mfa_recovery_codes` — recovery-code endpoints (baseline, every tier)
- `mfa_multiple_devices` — multiple WebAuthn credentials per Identity (team+)
- `mfa_step_up` — `mfa.require_recent_challenge` enforcement (enterprise)

See entitlements.json for the plan-tier breakdown.

## 7. What this module does NOT do (non-goals)

Cross-referenced with design.md §12:

- **No SMS-based OTP** — SMS is unfit for MFA per NIST 800-63B (SIM-swap /
  carrier-compromise). Not implemented, never will be.
- **No passwordless-first flow** — WebAuthn is offered as a second factor only
  in Wave 1a. Passwordless (WebAuthn as the sole factor) is reconsidered in Wave
  1c.
- **No push-based MFA** — 'Approve on your phone?' prompts require a mobile
  runtime. Deferred to Wave 2.
- **No FIDO MDS enforcement by default** — the FIDO Alliance Metadata Service is
  available as an OPT-IN inbound webhook (see webhooks.json). Default behaviour
  accepts any spec-compliant authenticator; tenants requiring MDS-verified
  certifications opt in via config.
- **No cross-tenant MFA transfer** — a hardware key registered on Identity A
  cannot be transferred to Identity B. Each Identity has its own credential set.
- **No MFA-secret export** — even the account holder cannot export their own
  TOTP secret post-enrolment. The plaintext is destroyed after round-2 confirm.
- **No HTTP endpoint for challenge INITIATION** — that lives in identity/auth
  (POST /api/v1/auth/mfa/challenge/initiate). This module owns only /verify.
- **No tenant / application scope** on WebauthnCredential. It belongs to the
  global Identity.
- **No scope-substrate integration** — WebAuthn credentials are not a
  configuration consumer; the `scope` module never touches
  `webauthn_credentials`.

## 8. Cross-references

- `.kiro/specs/identity/design.md` — the locked spec this blueprint materialises
  (D1: Identity vs User split; §7.2 MFA challenge flow; §12: non-goals).
- `.kiro/steering/hierarchy.md` §3 — Identity vs User split canonical
  vocabulary.
- `.kiro/steering/tenancy-columns.md` — column-attribution contract;
  WebauthnCredential is on the "NO application_id, NO tenant_id" side because it
  inherits from Identity's global scope.
- `modules/identity/blueprints/identity/` — the substrate this module composes
  on top of.
- `modules/identity/blueprints/auth/` (Wave 3) — the protocol layer that
  initiates challenges + issues PATs on challenge success.
- `modules/identity/blueprints/user/` — the per-Application projection that
  references `identities.id` via `users.identity_id`.
- `modules/identity/blueprints/platform-user/` — the platform-staff principal
  that reuses this substrate.
- `modules/shared/blueprints/localization/` — canonical style reference (this
  blueprint mirrors its file structure).

## 9. Migration + rollout notes

- Depends on `foundation` (base infrastructure — HasUlids, HasMetadata,
  HasActivityLog) and `compliance` (retention hold-period extension protocol)
  and `identity` (the storage substrate).
- No existing rows to migrate — this is a from-scratch table shipping with the
  identity-service Day-1 build.
- Extended by `auth`, `user`, `platform-user`. All three land after `mfa` in the
  boot order (priorities 25, 18, 19 — auth's priority is HIGHER so it boots LAST
  because it composes over the substrate).
- The WebAuthn stack (`web-auth/webauthn-lib`) requires the `openssl` and
  `sodium` PHP extensions — the `mfa-webauthn-library-loaded` health probe
  refuses boot when either is missing.
- The TOTP library (`pragmarx/google2fa`) requires no extensions but does
  require a working RNG — health probe verifies both.
- The KMS backend must be reachable at boot for MFA enrolment to succeed;
  existing enrolled Identities can still verify (their data-key is hot-cached in
  the in-process cache — see identity's caches.json).
- Initial deployment requires two feature flags on for the module to be usable:
  `mfa.enrollment_enabled` + `mfa.verification_enabled`. Both default on; ops
  can flip them off during an incident.

## 10. The invariant we care most about

The **plaintext TOTP secret never touches durable storage before the round-2
confirmation**. Verified by:

1. Round 1 stores the secret in a signed Redis envelope
   (`mfa:enroll:preview:{session_id}`) with 5-minute TTL + encryption-at-rest.
2. Round 2 reads the envelope, verifies the confirmation code, encrypts +
   persists via identity/identity's `MfaSecretEncryptor.encrypt()`, then deletes
   the envelope in the same transaction.
3. If round 2 never runs, `PurgeUnconfirmedEnrollmentsJob` evicts the envelope
   - fires MfaEnrollmentFailed(reason=preview_expired).

Any code path that violates this invariant — persisting the plaintext to
Postgres before confirmation, logging it, emitting it in a metric, caching it
outside the envelope — is a P0 bug and a compliance violation. The
`data-classes.json` classification of `MfaEnrollmentPreview.totp_secret` as
`regulated_secret` is the compile-time evidence of this rule.
