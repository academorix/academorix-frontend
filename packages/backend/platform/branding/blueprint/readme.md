# branding

**White-label branding profile per Tenant.** Owns `Branding` — theme, palette,
logo variants, typography, and OG-image seeds. Every render path (product SPA,
marketing site, transactional email, OG preview) reads branding to render the
tenant's identity.

Extracted from `tenants` at v0.3 for two reasons:

1. **Read/write ratio is 100:1.** Every render reads; only tenant owners mutate.
   Warrants its own cache pattern (Redis-cached with an event-driven
   invalidation on `BrandingUpdated`).
2. **BrandingPayload cast + BrandingObserver form a self-contained slice.** The
   palette validation, hex-color rules, contrast-ratio check, and OG-image
   regeneration pipeline all fan out from Branding — they don't belong in the
   tenants core.

## Entities

| Entity     | ULID   | Description                                                                                                                                         |
| ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Branding` | `brd_` | Theme + logo profile per Tenant. Contains palette (JSON), logo variants (light / dark / mark / mono), typography (font stacks), and OG-image seeds. |

## Contributions

- **Casts:** `BrandingPayload` (deserialises the JSONB payload into a typed VO).
- **Bindings:** `BrandingResolver` (Redis-cached, invalidated on
  `BrandingUpdated`), `OgImageRenderer`.
- **Jobs:** `SyncBrandingJob`, `RegenerateOgImageJob`.
- **Events:** `BrandingCreated`, `BrandingUpdated`, `BrandingReset`,
  `BrandingArchived`.
- **Rules:** `valid_hex_color`.

## Boot order

Priority **12** — boots after `tenants` (10).

## Cross-cutting invariants

- **Every Branding row carries `tenant_id`** via `BelongsToTenant`.
- **BrandingResolver is a hot path** — never issue a query for it in a
  request-handler; always resolve through the binding (Redis-first).
- **OG-image regeneration runs after commit** —
  `BrandingUpdated implements ShouldDispatchAfterCommit` so a failed image regen
  doesn't roll back the branding change.

## Related

- `../README.md` — platform tier index.
- `.kiro/steering/hierarchy.md` §6 — module responsibility map.
