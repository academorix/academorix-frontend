# identity/identity — Phase 3 implementation status

## Status: SCAFFOLDED + MODEL FIXED — actions deferred

## What landed in this batch

- `Concerns/IsIdentity.php` — lifecycle helpers (isLockedOut, hasVerifiedEmail,
  auth identifier accessors).
- `Concerns/HasCredentialLifecycle.php` — failed-attempts counter management
  (recordSuccessfulLogin, recordFailedLogin, lockUntil).
- `Concerns/CanResetPassword.php` — bridges Laravel's password broker to the
  Stackra column contract.
- `Models/Identity.php` — recomposed. Implements `AuthenticatableContract` +
  `CanResetPasswordContract` + `IdentityInterface`; uses
  `Illuminate\Auth\Authenticatable` + `HasApiTokens` (Sanctum) + `Notifiable` +
  the three module traits.
  `#[Hidden([PASSWORD_HASH, MFA_SECRET_ENCRYPTED, MFA_RECOVERY_CODES_HASHED, EMAIL_VERIFICATION_TOKEN_HASH, PASSWORD_HISTORY_HASHED])]`
  — every secret is opted out of `toArray()`. `authPasswordName()` returns
  `password_hash` so Sanctum's Guard reads the correct column.

## Deferred

### Actions (still `return null` scaffolds)

Every action under `identity/identity/src/Actions/**` (if the module ships any —
check the blueprint routes.json). Typical set based on the module's role:

| Concern                    | Action                           | Notes                                                                                                                                                                                                                     |
| -------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lookup                     | `FindIdentityByEmailAction`      | Platform-scope only — returns 404 to non-platform-admin callers regardless of whether the email exists (anti-enum).                                                                                                       |
| Registration               | `RegisterIdentityAction`         | Body: email + password (validated by `PasswordWeakException` rules) + optional DOB (age gate). Creates Identity, emits `IdentityCreated`. Handles the case where `Auth\Actions\Tenant\CreateRegisterAction` delegates in. |
| Email verification issue   | `RequestEmailVerificationAction` | Delegates to `EmailVerificationTokenIssuer::issue`. Rate-limited.                                                                                                                                                         |
| Email verification consume | `VerifyEmailAction`              | Consumes the one-shot token; sets `email_verified_at`.                                                                                                                                                                    |
| Password reset issue       | `RequestPasswordResetAction`     | Delegates to `PasswordResetTokenIssuer::issue`. Rate-limited.                                                                                                                                                             |
| Password reset consume     | `ResetPasswordAction`            | Consumes the one-shot token; sets new `password_hash` via bcrypt cost 12; enforces `PasswordHistoryChecker` refusal on reuse.                                                                                             |

### Services that still need bodies

- `BreachedPasswordChecker` — HaveIBeenPwned k-anonymity API check (blueprint
  refs). Fail-open when HIBP is unreachable; fail-loud only when the response
  says "breached".
- `PasswordHistoryChecker` — bcrypt-check the candidate against the last N
  entries of `password_history_hashed`. N is config-driven (default 5).
- `AccountLockoutPolicy` — encapsulates the "after N failures set locked_until"
  decision. Referenced by `Auth::CreateLoginAction`.
- `CredentialHasher` — bcrypt wrapper with cost from config (12 default).
- `MfaSecretEncryptor` — KMS-backed encrypt/decrypt of the TOTP secret. Fails
  loud when KMS is unavailable (blueprint `MfaSecretKmsUnavailableException`).
- `EmailVerificationTokenIssuer` / `PasswordResetTokenIssuer` — bcrypt-hashed
  one-shot tokens with configurable expiry.

### Migrations outstanding

- Casts referenced in the model (`EncryptedMfaSecret::class`,
  `HashedRecoveryCodes::class`) don't yet exist as Cast classes. The current
  fallback uses Laravel's built-in `encrypted` + `array` casts, which is
  functional but doesn't enforce the "each recovery code is bcrypt-hashed"
  invariant. Add
  `packages/identity/identity/src/Casts/HashedRecoveryCodes.php` +
  `.../EncryptedMfaSecret.php` when the MFA flow lands.

### Test coverage outstanding

- Identity model — hidden-field enforcement (every secret column absent from
  toArray).
- `HasCredentialLifecycle` unit tests — 5 failed → lockout escalation.
- `IsIdentity::isLockedOut()` — boundary conditions on the locked_until
  timestamp.

## Follow-up handoffs

- `test-mutation-engineer` — priority module. Any surviving mutant here (in a
  hash comparison, in the lockout escalation, in the hidden-field list) is a
  real-world credential exposure.
- `security-compliance-reviewer` — audit the reset-token flow when it lands
  (one-shot use, bcrypt on the hash column, uniform failure payload).
