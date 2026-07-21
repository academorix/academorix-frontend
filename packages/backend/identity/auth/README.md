# stackra/auth

Server-side Laravel package for the `auth` module. Auto-generated from the
blueprint at `modules/identity/blueprints/auth/`.

## Entities

- **AuthCrossAppGrant** (`acg_...`) — One-time-use cross-Application SSO grant.
- **AuthEmailVerification** (`aev_...`) — Email-ownership verification token.
- **AuthJwtDenyList** (`ajd_...`) — Deny-list entry for a specific jti — revoke
  a JWT immediately before its natural expiry.
- **AuthJwtSigningKey** (`ajk_...`) — HS256 signing key with per-Application
  binding + rotation.
- **AuthMfaChallenge** (`amc_...`) — Pending MFA challenge — an in-progress
  login waiting for TOTP / WebAuthn / recovery-code verification.
- **AuthPasswordReset** (`apr_...`) — One-time-use password reset token.
- **AuthRefreshToken** (`atr_...`) — Refresh token —
  rotation-with-reuse-detection paired with Sanctum PAT.
- **JwksResponse** (`...`) — The JWKS payload served at GET /.
- **JwtPayload** (`...`) — The structured payload of an inter-service HS256 JWT.

## Layout

```
src/
├── Providers/                     # <Name>ServiceProvider (module boot)
├── Contracts/
│   ├── Data/*Interface.php        # TABLE + ATTR_* constants (#[Bind]-bound to Model)
│   └── Repositories/*Interface.php
├── Models/*.php                   # Eloquent, attribute-first
├── Repositories/*.php             # #[AsRepository] + #[UseModel]
├── Data/*.php                     # Spatie Data output DTOs
├── Policies/*.php                 # Wired via #[UsePolicy] on the Model
├── Events/*.php                   # Domain events (ShouldDispatchAfterCommit)
└── Actions/*.php                  # Single-invoke controllers (#[AsController])
database/
├── migrations/*.php
├── factories/*.php
└── seeders/*.php                  # (dual-source catalogues only)
tests/
├── Feature/
└── Unit/
```

## Regeneration

```bash
python3 modules/shared/blueprints/foundation/scripts/generate-module.py \
    identity auth --force
```

Files carrying the `AUTO-GENERATED` header are safe to regenerate; every other
file is a hand-tuned override that survives regeneration.

## Companion wire SDK

The wire-visible Saloon + Spatie Data package lives at
`stackra-identity/auth-sdk` under `sdk/identity-auth-sdk/`. Consumers cross
the service boundary through the SDK; this package is the SERVER-side owner of
the domain.
