# identity — SDUI blueprints

## Surfaces

### None owned by this module

The `identity` module ships NO tenant-facing SDUI surfaces. It is a security
substrate — the tenant surface (login form, MFA enrolment wizard, password reset
flow) is owned by `identity/auth`. The platform-admin surface (identity list +
detail + unlock + force-reset + erase) is also owned by `identity/auth` so the
SDUI blueprints live alongside the routes they render for.

This directory exists to anchor the future home:

- `resources/` — reserved for platform-admin identity list + detail screens when
  they land in `identity/auth`. Empty today.
- `widgets/` — reserved for reusable identity-status widgets (e.g. a
  `identity-status-chip.widget.json` rendering `is_locked` / `mfa_enabled` /
  `email_verified`). Empty today.

## Why the empty directory?

Two reasons:

1. **Blueprint-directory shape parity.** Every module blueprint under
   `modules/*/blueprints/*/` carries a `sdui/` subdirectory with a `readme.md`
   so consumers (validators, generators, doc renderers) can walk a single
   canonical shape. Missing directories break that walk.
2. **Anchor for future SDUI blueprints.** When `identity/auth` lands, its
   platform-admin identity-list + detail screens land under
   `modules/identity/blueprints/auth/sdui/resources/identity/`. The empty tree
   here signals "this belongs to identity, referenced by auth" instead of
   "identity has no admin surface".

## When SDUI arrives

Once `identity/auth` is authored, expect:

- `resources/identity/list.screen.json` — filterable by locked / unverified /
  erased. Redacted columns (fingerprint, no email).
- `resources/identity/show.screen.json` — read-only detail. PII unmute gated on
  `platform.identity.view.pii` permission (server-enforced; the widget respects
  the response).
- `widgets/identity-status-chip.widget.json` — colour-coded status chip.
- `widgets/lockout-countdown.widget.json` — live countdown to `locked_until`.

These live under `identity/auth`'s blueprint, not here. The `identity` substrate
stays UI-free by design.
