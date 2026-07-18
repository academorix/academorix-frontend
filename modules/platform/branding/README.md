# academorix/branding

White-label branding substrate for Academorix tenants. Owns the `Branding`
aggregate — theme, palette, logo variants, typography, and custom CSS variables.

## Aggregate

| Aggregate  | ULID prefix | Purpose                                                                                                        |
| ---------- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| `Branding` | `brd_`      | Theme + palette + logo profile per Tenant. Multiple profiles per tenant (day/night, per-domain, seasonal). One `is_default = true` per tenant. |

## Install

```bash
composer require academorix/branding
```

## Blueprint

Wire contract at `modules/platform/blueprints/branding/`.

## Contributes

- **Contracts (framework-swappable)**: `BrandingResolverInterface` (per-domain
  or per-tenant resolution) + `OgImageRendererInterface` (open-graph card
  renderer). Default `Null*` implementations ship — consumer apps bind their
  own.
- **Permissions**: `BrandingPermission` (view + manage — dual-guard).
- **Commands**: `branding:regenerate-og-images`, `branding:seed-defaults`.
- **Events (4)**: `BrandingCreated`, `BrandingUpdated`, `BrandingReset`,
  `BrandingArchived`.
- **Rule**: `valid_hex_color`.
- **Cast**: `BrandingPayload` — structured DTO around the palette + logo bundle
  that `Tenant.branding` (JSONB) is denormalised from.

## Cache strategy

Repository ships `#[Cacheable(ttl: 3600, tags: true)]` — a 1-hour TTL and
tag-based invalidation. The observer flushes the tenant tag on every write, so
readers see stable snapshots but writes propagate immediately.

## Tests

```bash
composer install
vendor/bin/pest
```
