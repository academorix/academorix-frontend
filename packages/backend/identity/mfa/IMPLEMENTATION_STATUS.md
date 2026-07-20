# identity/mfa — Phase 3 implementation status

## Status: SCAFFOLDED — every Action / Service returns `null`

## Implementation plan

MFA sits between `identity/identity` (owns the mfa columns) and
`identity/auth` (owns the challenge / verification flow). The primary
credential-carrier is the Identity row itself (`mfa_secret_encrypted` +
`mfa_recovery_codes_hashed`); this module supplies the enrollment /
challenge / verify surface + the shared TotpProvisioner + RecoveryCodesGenerator.

### Actions to fill

| Action                              | Contract                                          | Notes                                                                                                                                                                    |
| ----------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `EnrollMfaAction`                   | `POST /api/v1/mfa/enroll`                         | Generate a fresh TOTP secret via `TotpProvisioner::provision`. Return the QR-code URI (otpauth://) + secret ONCE. Persist `mfa_secret_encrypted` on the caller's Identity. |
| `ConfirmMfaAction`                  | `POST /api/v1/mfa/confirm`                        | Verify a TOTP code against the just-issued secret. On success generate 10 recovery codes via `RecoveryCodesGenerator`, bcrypt-hash each, persist them.                    |
| `DisableMfaAction`                  | `POST /api/v1/mfa/disable`                        | Clear `mfa_secret_encrypted` + `mfa_recovery_codes_hashed`. Requires re-auth (fresh password) as an anti-hijack guard.                                                    |
| `RegenerateRecoveryCodesAction`     | `POST /api/v1/mfa/recovery-codes/regenerate`      | Regenerate the 10 recovery codes. Return plaintext codes ONCE.                                                                                                            |
| `ListRecoveryCodesAction`           | `GET /api/v1/mfa/recovery-codes`                  | Return only the MASK (last 2 chars of each) so the client can render a "you still have N codes left" UI. Full codes are never re-emitted after regenerate.                |

### Services to implement

- `TotpProvisioner` — generate a 32-byte random Base32-encoded secret; return
  the `otpauth://` URI keyed by tenant name + user email. Uses `otphp/otphp`
  (add composer dep) or `pragmarx/google2fa` (already common in Laravel).
- `TotpVerifier` — verify a 6-digit code against a stored secret. Allow ±1
  window (30s clock drift tolerance).
- `RecoveryCodesGenerator` — 10 codes of shape `xxxx-xxxx-xxxx` (Crockford
  Base32). Bcrypt-hash each before persistence.
- `WebauthnCredentialManager` — U2F / WebAuthn enrollment + assertion.
  Deferred; Wave 1a ships TOTP + recovery codes only. Requires the
  `web-auth/webauthn-lib` composer dep.

### Middleware to write

- `mfa.required` — enforce enrolled MFA on protected paths. Reads
  `Identity.mfa_secret_encrypted !== null` and refuses when off. Applied to
  every `/api/v1/platform/**` route by default.

### Events to fire

- `MfaEnrolled` — after successful `ConfirmMfaAction`.
- `MfaDisabled` — after `DisableMfaAction`.
- `MfaRecoveryCodeUsed` — one-time use marker so re-play attempts fail.
- `RecoveryCodesRegenerated` — for audit trail.

### Cross-module dependencies

- `identity/identity::MfaSecretEncryptor` — KMS-backed cipher for the
  `mfa_secret_encrypted` column (deferred there too).
- `identity/auth::MfaChallengeDispatcher` — issues short-lived challenge
  tokens after password verification but before MFA verify.
- `identity/auth::CreateVerifyAction` — the second-step verifier the tenant
  login flow branches into when MFA is enrolled.
- `notifications` — recovery-codes-used alert to Identity email.
