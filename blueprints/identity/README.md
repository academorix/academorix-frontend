# `modules/identity/` — identity-service blueprints

**Empty tier — placeholder anchor for the authentication authority.**

The identity-service (`apps/identity-service/`) is the sole issuer of every JWT
downstream services trust. This tier will hold the modules that back it. Nothing
is authored yet; scaffolding lives here so the tier's future home is anchored
today.

## Planned modules

Five modules will land here. Ordering follows the identity spec (see
`.kiro/specs/identity/`) and is deliberately built on top of the tenants
substrate.

| Module              | Priority target | Purpose                                                                                                                                                          |
| ------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `identity/`         | 15 (Wave 1.5)   | Global credential record — one row per real human across every Application. Owns email (citext, unique), password hash, MFA secret, email verification, lockout. |
| `auth/`             | 25 (Wave 3)     | Login / refresh / 2FA / impersonation, session + PAT issuance, **JWT signing + JWKS publication**, cross-app SSO grants.                                         |
| `mfa/`              | 20 (Wave 2)     | TOTP, WebAuthn, recovery codes. Composable from `auth` and `identity`.                                                                                           |
| `oauth/`            | 24 (Wave 3)     | OAuth client registry — third-party integrations + service-to-service.                                                                                           |
| `service-accounts/` | 24 (Wave 3)     | Machine credentials — the HS256 inter-service JWT contract every service verifies.                                                                               |

**Note on the split.** `Identity` (credential) and `User` (per-Application
projection) are **distinct** concepts (see `hierarchy.md` §3). `Identity` lives
here; `User` per Application lives in the `user/` module (which will land under
`platform/` or its own tier once designed). One `Identity` → many `User` rows,
one per Application.

## Why identity is separate from platform

The identity-service is the **root of trust** for every other service. It:

1. **Signs every JWT** — every other service verifies locally against its JWKS.
   No per-request callback to Identity.
2. **Owns the credential graveyard** — email/password + MFA secrets never leave
   this service's database.
3. **Ships alone in every deployment** — even single-product on-prem installs
   need Identity + one product; Billing may be omitted, Platform may be trimmed,
   but Identity is non-negotiable.

Merging Identity into Platform would make a Sports on-prem install carry
tenant-config code it doesn't need, and would put credential storage in the same
DB as tenant config — the two have very different backup and access policies.

## HTTP surface (planned)

- **Tenant audience** (`/api/v1/auth/*`, `sanctum` guard) — SPA + mobile login.
- **Platform-admin** (`/api/v1/platform/*`, `platform_admin` guard) — staff.
- **JWKS** (`/.well-known/jwks.json`) — public keys, aggressive Cache-Control.

Every tenant-audience request carries `X-Application-Id`; Identity resolves the
matching `users` row and mints a token whose `app` claim binds it to that one
Application.

## Deferred decisions

- **Cross-app SSO grant model** — link `Identity#123` to
  `User@Sports + User@Marketplace + User@Education`? The Identity spec covers
  this in D1/D2.
- **Passwordless-first?** WebAuthn as the primary factor is a strategic call
  that needs its own ADR before `auth/` is authored.
- **Rate-limit budget** — login endpoints need their own quota bucket
  (independent of the API tier); land this alongside `auth/`.

## For agents

**Do not scaffold placeholder modules here until the identity spec is locked.**
An empty tier signals _"future home is reserved"_ to the reader; half-authored
modules confuse the validator and the module graph.

When it's time:

1. Read `.kiro/specs/identity/design.md` (locked D1-D3).
2. Author `identity/` first — every other module here depends on it.
3. Author `auth/` next — issues the JWTs everyone else verifies.
4. `mfa/` + `oauth/` + `service-accounts/` land in parallel after `auth/`.
5. Update `shared/foundation/data/ulid-prefixes.json` in the same commit that
   adds new prefixes.
6. Update `shared/foundation/data/module-graph.dot` to cluster the new nodes
   under the `identity/` cluster.

## Related

- `../README.md` — master index.
- `.kiro/specs/identity/` — the identity + application spec.
- `.kiro/steering/hierarchy.md` §3 — Identity vs User split.
- `.kiro/steering/hierarchy.md` §4 — two-audience boundary.
- `.kiro/steering/hierarchy.md` §12 — service split (identity-service is SHARED
  across every Application).
