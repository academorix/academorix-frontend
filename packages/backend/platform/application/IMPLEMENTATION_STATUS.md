# platform/application — Phase 3 implementation status

## Status: PARTIAL — Application registry + JWT signing keys landed; keypair rotation pending

## What landed

- `Application` model + interface — the top of the tenancy tree. One row per
  Stackra product (Sports, Marketplace, Federation, ...). Carries `slug`,
  `name`, `description`, `is_enabled`, plus the JWT signing key rotation table
  (`application_jwt_signing_keys`).
- Existing scaffolding covers CRUD action stubs for the platform-admin surface
  at `/api/v1/platform/applications`.

## What's pending

### Actions to complete

- `CreateApplicationAction` — persist a new Application row + atomically create
  the first `application_jwt_signing_keys` row + fire `ApplicationCreated`.
- `UpdateApplicationAction` — mutable `name`, `description`, `is_enabled`. Slug
  is immutable after create.
- `DisableApplicationAction` / `EnableApplicationAction` — lifecycle. Disabled
  Applications reject every request at `ResolveApplication` middleware.
- `RotateKeypairAction` (POST `/{application}/rotate-keypair`) — provisions a
  new `application_jwt_signing_keys` row with a fresh key + 30-day overlap
  window with the previous key. Fires `ApplicationKeypairRotated`.
- `ListApplicationAction` / `ShowApplicationAction` — platform-admin CRUD read
  surface.
- Public `GET /.well-known/jwks.json/{application}` — JWKS endpoint publishing
  the currently-active + previously-active public keys for downstream verifier
  services.

### Services

- `ApplicationKeypairRotator` — generates a fresh HS256 key (or RS256 keypair
  when the module upgrades to asymmetric signing) + persists it encrypted via
  Laravel Encrypter.
- `ApplicationRegistrar` — boot-time registrar that seeds the Stackra-shipped
  Applications (Sports, Marketplace, Federation, Academy, Gym) on `db:seed`.
  `#[AsSeeder]` priority 10.

### Domain events

- `ApplicationCreated`, `ApplicationEnabled`, `ApplicationDisabled`,
  `ApplicationKeypairRotated` — per the blueprint's events.json.

### Cross-module dependencies

- **`platform/tenancy`** — every `Tenant` row carries `application_id`
  referencing this table. Tenant creation validates the FK.
- **`identity/auth`** — the JWT signer reads `application_jwt_signing_keys` for
  the active row per Application. Rotation invalidates existing tokens on the
  OLD key after 30d.

## Backlog priorities

1. **P0 — Full CRUD actions.**
2. **P0 — Seeder for shipped Applications.**
3. **P1 — Keypair rotation flow.**
4. **P2 — Public JWKS endpoint** (blocked on asymmetric-signing migration, which
   is a separate ADR).
