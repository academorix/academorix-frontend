# identity/auth — Phase 3 implementation status

## Status: PARTIAL — trust boundary complete, tenant auth surface complete, MFA + platform + cross-app deferred

## What landed in this batch

### Trust-boundary primitives (P0) — DONE

- `Services/JwtSigner.php` — HS256 signer per RFC 7519, kid-based key rotation
  from `auth_jwt_signing_keys` with `SERVICE_JWT_SECRET` boot-secret fallback.
  32-byte minimum enforced. `#[Scoped]`.
- `Services/JwtVerifier.php` — full 13-step verification list
  (split-decode → alg=HS256 → kid lookup → hash_equals compare → iss/aud/exp/iat
  → deny-list). Every failure throws `JwtInvalidException` with `context.step`
  tag; wire payload is uniform to prevent enumeration.
- `Services/JwtDenyListManager.php` — Redis-cached + DB-backed jti deny list.
  `deny()`/`contains()`/`pruneExpired()`. O(1) hot path.
- `Data/JwtPayloadData.php` — Spatie DTO mirroring `jwt-payload.schema.json`.
- `Data/SignedJwtData.php` — signer output.
- `Providers/AuthServiceProvider.php` — `#[OnBoot]` guard that calls
  `JwtSigner::assertBootSecretValid()` outside testing.

### Sanctum PAT surface (P1) — DONE

- `Services/SanctumTokenIssuer.php` — thin wrapper over Sanctum's `createToken`.
- `Data/IssuedSanctumTokenData.php` — issuer output DTO.

### Tenant auth actions (P1) — DONE

- `Actions/Tenant/CreateLoginAction.php` — bcrypt Identity auth + Sanctum PAT
  issuance + lockout on failed_attempts_count >= config threshold.
- `Actions/Tenant/CreateLogoutAction.php` — revoke current PAT.
- `Actions/Tenant/CreateLogoutAllDeviceAction.php` — revoke every PAT.
- `Actions/Tenant/DeleteSessionAction.php` — revoke a specific PAT by id, with
  IDOR guard (tokenable_id + tokenable_type strict match).
- `Actions/Tenant/ListSessionAction.php` — enumerate PATs (public metadata).
- `Actions/Tenant/ListMeAction.php` — echo Identity public profile.

## Deferred

### Tenant path (still `return null` scaffolds)

| Action                          | Contract                                       | Notes                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CreateRegisterAction`          | `POST /api/v1/auth/register`                   | Create Identity + optional invitation code. Enforce `RegistrationPolicy` (invite-only? public? minor age check?).                                                 |
| `CreateVerifyAction`            | `POST /api/v1/auth/verify`                     | Second-step MFA verify. Consumes `MfaChallengeDispatcher` state; TOTP verify via `otphp/otphp` (add composer dep); recovery codes are one-shot.                   |
| `CreateForgotAction`            | `POST /api/v1/auth/forgot`                     | Password-reset issue. Rate-limited 3/min per IP. Delegates to `PasswordResetTokenIssuer` (already scaffolded).                                                    |
| `CreateResetAction`             | `POST /api/v1/auth/reset`                      | Consume the token + set new password. `PasswordHistoryChecker` refuses reuse.                                                                                     |
| `CreateChangeAction`            | `POST /api/v1/auth/change-password`            | Change password while authenticated. `Hash::check` old password + `PasswordHistoryChecker` on new.                                                                |
| `CreateRequestVerificationAction` | `POST /api/v1/auth/request-verification`    | Re-send email-verification token. Rate-limited.                                                                                                                   |
| `CreateExchangeAction`          | `POST /api/v1/auth/exchange`                   | Cross-app SSO exchange — consume `AuthCrossAppGrant` + issue a JWT for the target app.                                                                            |
| `CreateGrantAction`             | `POST /api/v1/auth/cross-app/grant`            | Issue a one-time grant token for cross-app SSO. `CrossAppGrantIssuer` (scaffolded).                                                                               |
| `CreateRefreshAction`           | `POST /api/v1/auth/refresh`                    | Refresh-token rotation. Consumes `AuthRefreshToken` + issues a new PAT + jti-denies the previous one (calls `JwtDenyListManager::deny`).                          |

### Platform path (still `return null` scaffolds)

| Action                     | Contract                                                   | Notes                                                                                          |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `CreateLoginAction` (platform) | `POST /api/v1/platform/auth/login`                     | Same shape as tenant login but resolves against `platform_users` guard.                        |
| `CreateForgotAction` (platform) | `POST /api/v1/platform/auth/forgot`                   | Password-reset for platform admins.                                                            |
| `CreateResetAction` (platform)  | `POST /api/v1/platform/auth/reset`                    | Same reset flow, platform_users guard.                                                          |
| `CreateVerifyAction` (platform) | `POST /api/v1/platform/auth/verify`                   | MFA verify for platform admins.                                                                 |
| `CreateStartAction`         | `POST /api/v1/platform/auth/impersonation/start`          | Support impersonation. Requires `#[RequirePermission('platform.impersonate')]` + reason field. Fires `SessionImpersonationStarted`. |
| `CreateEndAction`           | `POST /api/v1/platform/auth/impersonation/end`            | End impersonation; restore original session.                                                    |
| `CreateJwtDenyListAction`   | `POST /api/v1/platform/auth/jwt-deny`                     | Administrative jti revocation. Delegates to `JwtDenyListManager::deny`.                        |
| `CreateRotateAction`        | `POST /api/v1/platform/auth/jwt-signing-keys/rotate`      | Rotate the active `auth_jwt_signing_keys` row. Provisions a fresh row + retires the previous. |
| `ListJwtSigningKeyAction`   | `GET /api/v1/platform/auth/jwt-signing-keys`              | Enumerate keys (public metadata only — never the encrypted material).                          |
| `CreateRefreshAction` (platform) | `POST /api/v1/platform/auth/refresh`                 | Platform refresh flow.                                                                          |
| `CreateLogoutAction` (platform)  | `POST /api/v1/platform/auth/logout`                  | Platform logout.                                                                                |
| `ShowIdentitieAction`       | `GET /api/v1/platform/identities/{identity}`              | Platform-audience Identity detail — sensitive fields exposed only to `platform_admin` guard.   |
| `ListIdentitieAction`       | `GET /api/v1/platform/identities`                         | Listing.                                                                                        |
| `DeleteIdentitieAction`     | `DELETE /api/v1/platform/identities/{identity}`           | Hard-delete an Identity (GDPR erasure path). Refuses when `IdentityHoldExtendedException`.     |
| `UnlockAction`              | `POST /api/v1/platform/identities/{identity}/unlock`      | Clear `locked_until` + reset `failed_attempts_count`.                                          |
| `ForcePasswordResetAction`  | `POST /api/v1/platform/identities/{identity}/force-reset` | Force `password_changed_at = null` so next login requires a change.                            |

### Public path (unauthenticated)

| Action                | Contract                                    | Notes                                                                                                       |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ListAuthAction`      | `GET /.well-known/auth-metadata`            | Emit issuer + supported flows discovery document (OIDC-style).                                              |
| `ListJwksJsonAction`  | `GET /.well-known/jwks.json`                | Publish the JWKS. For Wave 1a HS256 the JWKS is empty (shared secret model); Wave 1c RS256 will populate it. |

### Services that still need bodies

- `RegistrationPolicy` — resolves invite-only vs public vs age-gated
  registration mode from tenant settings.
- `CompliantAgePolicy` — enforces minimum age (COPPA / GDPR).
- `MfaChallengeDispatcher` — creates + expires `AuthMfaChallenge` rows.
- `PasswordResetTokenIssuer` / `EmailVerificationTokenIssuer` — issue + verify
  the one-shot tokens.
- `RefreshTokenIssuer` — rotate refresh tokens with anti-replay tracking.
- `CrossAppGrantIssuer` — mint one-time cross-app grants (5-min expiry, hashed
  token).
- `SessionRevoker` — bulk-revoke on password change / MFA reset (fanout to
  every PAT + jti deny for outstanding JWTs).
- `JwtKeyRotator` — provision a fresh `auth_jwt_signing_keys` row + flip the
  active flag atomically.
- `DeviceFingerprinter` — extract UA + IP heuristics; consumed by the
  suspicious-activity signal.
- `ScopeSuffixResolver` — resolve `.branch` / `.own` scope suffixes on
  permission strings.

### Boot-time wiring outstanding

- Rate limiters — the `throttle:login`, `throttle:token-exchange`,
  `throttle:password-reset` named limiters need to be registered in the
  routing package's rate limiter (or in `AuthServiceProvider::#[OnBoot]`).
  Values are in `config/auth.php` + `config/service-accounts.php`.
- Sanctum's `personal_access_tokens.tokenable` — the guard needs to be pointed
  at the `Identity` model, not the default `App\Models\User`. Add to the app's
  `config/sanctum.php` `guard`/`stateful` blocks.

### Migrations outstanding

- **Duplicate migration** `2026_07_15_120003_create_auth_jwt_signing_keies_table.php`
  (typo — `keies`) coexists with the correct
  `create_auth_jwt_signing_keys_table.php`. The regenerator's plural inflector
  fix landed in commit c60e68de7 but the old file was NOT deleted. Manual
  cleanup: `rm database/migrations/2026_07_15_120003_create_auth_jwt_signing_keies_table.php`.

### Test coverage outstanding

Every action + service above wants at least:

- One Feature test (route hit + happy path + one failure per exception).
- One Unit test on the service (mock the repo, exercise every branch).
- `JwtSigner` + `JwtVerifier` want a round-trip test (`verify(sign($payload))
   === $payload`) + explicit failure-mode tests per verification step.
- `JwtDenyListManager` wants a Redis-cache round-trip test.

See `.kiro/steering/testing.md` and `.kiro/steering/actions-only-full.md`
§Testing.

## Follow-up handoffs

- `test-mutation-engineer` should run against the three trust-boundary services
  (`JwtSigner`, `JwtVerifier`, `JwtDenyListManager`) at max mutation coverage
  once feature tests exist — the trust boundary is exactly the place a
  surviving mutant would be a real-world CVE.
- `security-compliance-reviewer` should audit the deferred MFA + reset flow
  when it lands (constant-time compare on the reset token hash + one-shot use
  + rate-limit enforcement).
