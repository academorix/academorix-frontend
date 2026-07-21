# platform/theme — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD + preview pending

## What landed

- `Theme` model + `ThemeInterface` — the tenant branding record. Carries
  `tenant_id`, `name`, `is_active`, the design-token block (`primary_color`,
  `secondary_color`, `accent_color`, `background_color`, `foreground_color`,
  `font_family`, `border_radius`), plus per-surface overrides (login page, mail
  header, invoice PDF footer).

## What's pending

### Actions to complete

- Full CRUD — `CreateTheme`, `UpdateTheme`, `ShowTheme`, `ListThemes`,
  `DeleteTheme`.
- `SetActiveTheme` (POST `/{theme}/activate`) — one theme per tenant is
  `is_active: true`. Atomically flips the flag + deactivates the previous
  active. Fires `ThemeActivated`.
- `RenderPreview` (GET `/{theme}/preview`) — renders an HTML preview page with
  the theme's tokens applied. Consumers: the tenant admin's live-preview iframe.

### Services

- `ThemeApplier` — reads the active theme + emits the CSS custom properties
  block that the frontend loads. Consumers: the SPA's bootstrap payload (via
  `/api/v1/tenant/theme/active`).
- `ThemeSeeder` — seeds Stackra-shipped default themes (Light, Dark, Auto).
  `#[AsSeeder]` priority 40.

### Domain events

- `ThemeCreated` / `ThemeActivated` / `ThemeArchived`.

### Cross-module dependencies

- **`platform/tenancy`** — Theme.tenant_id references Tenant.
- **`notifications/notifications-mail`** — mail templates read the active
  theme's mail-header block.
- **`finance/invoice`** — invoice PDFs read the active theme's brand block.
- Frontend consumer — reads `/api/v1/tenant/theme/active` for the bootstrap
  payload.

## Backlog priorities

1. **P0 — Full CRUD + activate.**
2. **P1 — Default theme seeder + Light/Dark/Auto.**
3. **P2 — Live preview.**
