# auth — changelog

## [Unreleased] — Wave 1a inception

**Blueprint-only. No code yet.**

Initial blueprint authoring for the `auth` module — the protocol layer that
operates on the `identity/identity` substrate. Codifies the D1/D2/D3 decisions
locked in `.kiro/specs/identity/design.md` §§7–10 and pins the enforceable
surface for the code phase that follows.

### Structural

- Seven owned tables — `auth_refresh_tokens`, `auth_password_resets`,
  `auth_email_verifications`, `auth_mfa_challenges`, `auth_cross_app_grants`,
  `auth_jwt_deny_list`, `auth_jwt_signing_keys`. Plus Sanctum's shipped
  `personal_access_tokens` (unchanged; auth OWNS the schema shipped by Sanctum).
- Prefixed ULIDs across the module: `atr_` (refresh), `apr_` (reset), `aev_`
  (verification), `amc_` (MFA challenge), `acg_` (cross-app grant), `ajd_` (JWT
  deny), `ajk_` (JWT signing key). Prefixes registered in
  `shared/foundation/data/ulid-prefixes.json` in the companion PR.
- NO `tenant_id` on ANY auth table — tenant / application scope propagates
  through polymorphic tokenable (User/PlatformUser) or via encoded JWT claims.
- Refresh tokens carry `family_id` for the rotation-with-reuse-detection chain
  per RFC draft-ietf-oauth-security-topics §4.13.
- JWT signing keys per-Application (nullable application_id for the global
  slot). KMS-envelope-encrypted `secret_encrypted`; plaintext HS256 secret NEVER
  touches Postgres, never held in a process-scoped cache.

### Contributions

- **21 events** — every auth-lifecycle transition (login, logout, session
  revocation single + bulk, refresh rotation + reuse detected, password reset
  init + complete, email verification req + complete, cross-app grant issued +
  exchanged + expired, MFA challenge issued + completed + failed, impersonation
  started + ended, JWT signing key rotated + jti revoked, new device detected).
  All payloads readonly value objects; every dispatch after-commit.
- **8 jobs** — six token-purge jobs on staggered cadences per retention.json
  (refresh 30-min, resets 5-min, verifications daily, MFA challenges 5-min,
  cross-app grants 15-min, JWT deny list daily). One monthly JWT-signing-key
  rotation. One async bulk-session-revocation triggered by PasswordChanged
  listener chain.
- **7 notifications** — password-reset-link, email-verification-link,
  login-from-new-device, login-from-new-location, password-changed-from-
  new-device, impersonation-session-active (cannot-opt-out), MFA-enrolled-
  confirmation. Categories seeded with transactional_required consent tier.
- **9 Artisan commands** — session listing/revocation (single + bulk), JWT key
  rotation + listing, deny-list add, expired-token purge (dry- run supported),
  signing-key test round-trip, token metadata describe.
- **6 validation rules** — five for opaque-token verification (refresh, reset,
  verification, MFA challenge, cross-app grant); one composed
  strong-password-via-auth that wraps identity's `strong_password` +
  `not_in_password_history` with auth-flow augmentation.
- **2 casts** — `JwtPayload`, `RefreshTokenFamily`.
- **5 middleware** — `auth.rate_limit_login`, `auth.enforce_session_scope`,
  `auth.jwt_verify`, `auth.cors_strict`, `auth.detect_new_device`.
- **2 macros** — `Str::sanctum_token_prefix` (Sanctum PAT wire format helper),
  `Blueprint::auth_token_fields` (migration shorthand for the token-column set
  shared across auth's token tables).
- **2 traits** — `HasScopeSuffixResolution` (marker on services that consult the
  resolver), `HasSessionRevocation` (composable helper for models whose state
  change revokes sessions).
- **2 attributes** — `#[AsAuthListener]` (auth-event subscribers),
  `#[RegistrationPolicy(contextType: X)]` (domain-specific registration policy
  override).
- **3 policies** — `AuthPolicy`, `SessionPolicy`, `CrossAppGrantPolicy`.
- **2 observers** — `RefreshTokenObserver` (family assignment + reuse-detection
  defense-in-depth), `PersonalAccessTokenObserver` (async last_used_at
  batching + scope validation).
- **13 listeners** — session-revocation chains (PasswordChanged, MfaDisabled,
  IdentityLocked, UserSuspended, UserDisabled, IdentityErased, TenantErased),
  refresh-reuse breach lockdown, JWKS cache invalidation, JWT-deny-list pubsub
  propagation, permission-revoke session-scope-cache invalidation, new-device
  detection, last_login_at update.
- **10 health probes** — DB writable, schema current, Redis reachable, JWT
  signing key reachable + KMS reachable, JWKS response cacheable, refresh-purge
  scheduler alive, MFA-challenge-purge scheduler alive, JWT rotation current (<
  45 days), deny-list size bounded.

### HTTP surface

- **35 routes** across three planes:
  - Tenant plane (`/api/v1/auth/*`): 16 routes covering interactive session
    lifecycle for tenant users.
  - Platform plane (`/api/v1/platform/auth/*` +
    `/api/v1/platform/identities/*` + `/api/v1/platform/jwt-*`): 17 routes
    covering Academorix-staff auth + identity substrate CRUD (auth OWNS the HTTP
    surface for the substrate that owns no routes) + JWT key management +
    impersonation + deny-list management.
  - Public plane: 2 routes (`GET /.well-known/jwks.json` + health probe).

### Compliance surface

- **NIST 800-63B** — AAL2 authenticator strength composition (password
  - TOTP/WebAuthn); §5.2.2 replay resistance (single-use MFA challenges); §5.2.5
    verifier compromise resistance (TOTP secret + JWT signing key both
    KMS-envelope-encrypted); §7.2 session management (absolute + idle lifetimes,
    rotation, deny-list).
- **OWASP ASVS V3** — session generation (40-byte crypto-random), session ID
  storage (SHA-256 hashes at rest), session rotation on privilege escalation,
  session termination on logout, absolute session lifetime.
- **OAuth 2.0 draft-ietf-oauth-security-topics** — §4.13 refresh rotation with
  reuse detection is the CANONICAL BCP defense: refresh reuse fires
  `RefreshTokenReuseDetected` → invalidates the family + every active PAT for
  the User + notifies user + writes compliance- audit entry.
- **GDPR** — Art. 5(1)(e) storage limitation (every token table has explicit
  retention); Art. 17 right to erasure (every auth-owned table cascades on
  Identity erasure); Art. 25 data protection by design (IPs + user agents
  SHA-256 hashed at rest); Art. 32 security of processing (rate limiting +
  progressive lockout + reuse detection); Art. 33 breach notification
  (RefreshTokenReuseDetected at critical severity).
- **CCPA** — right-to-know via GET /auth/sessions; right-to-delete cascades
  through identity_id.
- **SOC 2 Type 2** — CC6.1 logical access, CC6.3 user provisioning (composed via
  RegistrationPolicy), CC6.6 external threats (rate limiting + lockout + reuse
  detection + CORS), CC6.7 authenticator content protection (KMS
  envelope-encryption of every credential material), CC7.2 system monitoring.
- **COPPA** — 16 CFR §312.5 verifiable parental consent for under-13s enforced
  by CompliantAgePolicy at registration; refused with 422
  `REGISTRATION_REQUIRES_GUARDIAN_CONSENT`.

### Boundaries

- Auth NEVER stores credentials. Every password hash, MFA secret, recovery code,
  verification token hash, lockout state lives in the `identity/identity`
  substrate. Auth DELEGATES via the substrate's actions
  (Identity->verifyPassword, ->verifyTotp, ->consumeRecoveryCode,
  ->markLoginSuccess, ->markLoginFailure, ->markEmailVerified).
- Auth NEVER handles MFA verification. Owns the CHALLENGE dispatch + wait state
  (auth_mfa_challenges); delegates verification to `identity/mfa` actions.
- Auth NEVER handles RBAC vocabulary. Caches the compact permission array on
  Sanctum PAT abilities at issue-time from `access/rbac` (Wave 1b); does not
  manage roles or permissions.
- Auth NEVER stores impersonation sessions. Owns the START-POINT (impersonation
  PAT issuance) and END-POINT (revocation); the session row itself lives in
  `access/delegation` (Wave 1b).
- Auth tables carry NO `tenant_id` — polymorphic tokenable or identity_id or
  per-Application binding covers the scope.

### Compatibility

- Depends on `foundation`, `compliance`, `identity`, `user`, `platform-user`,
  `mfa`, `service-accounts`, `application`, `tenancy`.
- No existing rows to migrate — this is a from-scratch build shipping with the
  identity-service Day-1 deployment.
- Extended by `access/rbac` (Wave 1b), `workflow/approvals` (Wave 1b).
- Every downstream tenant-plane module consumes auth's middleware
  (`auth:sanctum` guard, `auth.enforce_session_scope`, `auth.jwt_verify`) but
  never injects auth services directly.

### Known blueprint deviations from the design spec

The blueprint stays faithful to design.md §7 (authentication flows), §8 (token
contracts), §10 (compliance floors), §12 (non-goals). Three pragmatic additions
that go slightly beyond the spec:

1. **`family_id` on refresh tokens** — design.md §7.3 mentions rotation with
   reuse detection but doesn't enumerate the family-tracking column. Added here
   to make the rotation chain queryable + to make the reuse-detection cascade
   (invalidate every token in the family) efficient.
2. **`context` JSONB on MFA challenges** — design.md §7.2 describes the MFA
   challenge but doesn't specify how the pending-login state (application_id,
   tenant_id, requested_scope) is preserved between challenge-issue and
   challenge-verify. Storing it in a JSONB blob on the challenge row is the
   minimal materialisation.
3. **JWT deny list (`auth_jwt_deny_list`)** — design.md §8 mentions immediate
   revocation as the fallback path but doesn't enumerate the deny-list table.
   Added here for concrete implementation. Populated only on password-change /
   user-suspend / breach-response; downstream verifiers refresh from JWKS +
   deny-list pubsub.

Every addition preserves every design invariant (no cross-scope FK, no
per-tenant credentials, HS256 in Wave 1a) and simply materialises the flows
described in prose.
