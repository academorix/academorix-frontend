# theme — changelog

Every change to this module lands here in reverse-chronological order. Follow
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) semantics + tag every
change with its wave / spec / ADR reference.

## [Unreleased] — inception (platform v0.4)

### Added

- Inaugural blueprint scaffold. Module authored as a sibling of `settings` +
  `branding` per `.kiro/steering/hierarchy.md` §5 (config-plane) +
  `.kiro/steering/tenancy-columns.md` §3 (tenant-scoped, no `application_id`
  shortcut).
- Three owned aggregates:
  - `Theme` (`thm_`) — per-tenant active theme record. Carries
    `selected_preset_id`, immutable `tokens_snapshot`, `mode` (light/dark),
    `accessibility_flags` jsonb, `is_active`, `activated_at` /
    `deactivated_at`. Composite partial unique index on
    `(tenant_id, mode)` WHERE `is_active = true AND deleted_at IS NULL`.
  - `ThemePreset` (`tps_`) — pre-built theme config. `tenant_id` NULL for
    platform-provided; non-null for tenant custom. Composite unique on
    `(COALESCE(tenant_id, 'platform'), slug)` — platform + tenant namespaces
    never collide.
  - `ThemeTokenOverride` (`tto_`) — sparse token patch on top of a preset.
    `{token_key, token_value, token_type}` per row. Composite unique on
    `(tenant_id, theme_id, token_key)`.
- Six entitlement gates:
  - `theme_capture` (all tiers) — master gate.
  - `theme_custom_presets` (Small=0, Medium=5, Enterprise=∞) — cap on
    custom tenant-owned presets.
  - `theme_token_overrides` (Small=0, Medium=25, Enterprise=∞) — cap on
    per-theme overrides.
  - `theme_accessibility_audit` (all tiers) — contrast auditor available.
  - `theme_dark_mode` (Small+) — dark-mode preset selection.
  - `theme_rollback_extended` (Enterprise) — keep last 20 activations
    instead of default 5 for rollback.
- Six seeded platform presets shipped in `data/preset-catalog.json`:
  `light-default`, `dark-default`, `high-contrast-light`,
  `high-contrast-dark`, `brand-forward-blue`, `brand-forward-green`.
- Canonical token vocabulary shipped in `data/token-vocabulary.json` — eight
  categories: color, spacing, typography, radius, shadow, motion, opacity,
  z_index.
- Accessibility flag catalog shipped in `data/accessibility-flags-catalog.json`
  — four flags: `high_contrast`, `reduced_motion`, `larger_text`,
  `focus_visible_always`.
- Ten published events:
  `ThemeCreated`, `ThemeActivated` (fires post-commit; clears tenant CSS
  cache), `ThemeDeactivated`, `ThemePresetCreated`, `ThemePresetPublished`,
  `ThemeTokenOverridden`, `ThemeTokenOverrideRemoved`,
  `ThemeAccessibilityFlagChanged`, `ThemeCacheInvalidated`,
  `UserThemePreferenceUpdated`.
- Five background jobs:
  `RegenerateRenderedCssJob` (post-activate compiled-CSS rebuild),
  `PreviewPresetJob` (async thumbnail generation via headless browser),
  `CacheThemeResolvedTokensJob` (warm the resolved-tokens cache),
  `PurgeExpiredThemeSnapshotsJob` (nightly — keep last 5 activations, 20 for
  Enterprise), `MigrateThemeTokensOnPresetUpdateJob` (platform-default preset
  schema changes migrate downstream overrides).
- Load-bearing invariants:
  - **Immutable `tokens_snapshot`** — frozen at activation via
    `ThemeObserver::updating(is_active: false → true)`. Mid-session preset
    edits land on a NEW `Theme` row.
  - **Cross-tenant preset isolation** — `ThemeObserver::creating` refuses when
    `selected_preset.tenant_id != tenant.id AND selected_preset.tenant_id
    != null`.
  - **Canonical vocabulary enforcement** — `PresetValidator` runs preset
    `tokens` jsonb against `data/token-vocabulary.json` before persistence.
  - **Post-commit CSS regen** — `RegenerateCssOnThemeActivated` is
    `ShouldDispatchAfterCommit` so a failed rebuild never rolls back the
    activation.
- Three notifications: `ThemeActivatedNotification`,
  `ThemePresetPublishedNotification`,
  `ThemeAccessibilityRecommendationNotification` (contrast-auditor findings).
- HTTP surface: tenant admin + design-role can CRUD themes, presets, and
  token overrides; end users may update their per-user
  `me/theme-preference` (mode + accessibility overrides). Platform-admin
  cross-tenant preset library management gated by the `platform_admin` guard.
- SDUI: theme list / activate / preview screens + preset list / create /
  duplicate + token-override list / edit + three reusable widgets
  (`token-badge`, `preset-thumbnail`, `mode-switcher`).
- Retention: themes retained while active + last-5 activations for rollback
  (last-20 for Enterprise via `theme_rollback_extended`); presets retained
  indefinitely for platform, per-tenant for custom; token overrides
  co-terminous with parent theme; `TenantErased` cascade deletes.
- WCAG 2.2 Level AA compliance evidence — `ContrastAuditor` computes AA
  (4.5:1) + AAA (7:1) ratios; findings surface as
  `ThemeAccessibilityRecommendationNotification`. **Informational, not
  blocking** — tenants may ship low-contrast themes; audit flags them.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `settings`.
- Extended by NONE.
- Planned consumers: `notifications`, `notifications-mail`, `newsletter`,
  `invoice`, `growth::marketing`.

### Design notes

- **The name game.** Every symbol carries `Theme*` (not `Skin*`, `Style*`,
  `DesignSystem*`). "Theme" is the noun in the design-token community + the
  wire vocabulary end users understand.
- **Distinct from `branding`.** Branding = static assets (logo, favicon).
  Theme = design tokens (color values, spacing values). A brand asset is a
  FILE; a theme token is a VALUE.
- **Distinct from `settings`.** Settings = free-form key-value config with
  cascading scope. Theme = a SPECIFIC vocabulary (tokens) with
  preset-selection + overlay-override semantics.
- **No `region_id` / `organization_id` / `branch_id` / `scope_node_id` on any
  of the three tables.** Theme is tenant-level; the per-user preference row
  lives in the user module.
- **Immutable snapshots are load-bearing** for two reasons: (1) mid-session
  admin theme edits never break end-user rendering (their session freezes
  the snapshot), (2) rollback works from any prior `tokens_snapshot` without
  needing to re-cascade every layer.
- **The contrast auditor is informational.** WCAG 2.2 AA is a
  RECOMMENDATION we surface — tenants own their brand and may knowingly
  ship a low-contrast theme (marketing-driven, brand-consistency-driven).
  Audit findings notify the tenant; they do NOT refuse the write.
- **Theme is NOT a scope-substrate consumer.** `scope_node_id` on any theme
  row would be a compliance failure — theme is tenant-level, not
  hierarchically cascading. See `.kiro/steering/hierarchy.md` §5 + `.kiro/
  steering/tenancy-columns.md` §4.

### ULID prefix registration

- `thm_` (Theme) — new
- `tps_` (ThemePreset) — new
- `tto_` (ThemeTokenOverride) — new

Register all three in
`modules/shared/blueprints/foundation/data/ulid-prefixes.json`. Verify no
collisions with the pre-existing prefixes.

### Wave notes

- Wave 5 lands the `newsletter` module — theme becomes a consumer for
  templated email token rendering. `RegenerateRenderedCssJob` grows an
  email-flavor CSS output alongside the SPA compiled CSS.
- Wave 5 lands the `growth::marketing` module — themed OG-image + banner
  generation reads theme tokens via `TokenResolver`.
- Wave 4.5 lands the `invoice` module — themed PDF invoices read theme
  tokens for header/footer/accent colors.
