# theme

**Per-tenant design token substrate.** Answers _"what does this tenant's
dashboard, email, and PDF look like?"_. Sibling of the settings module —
`settings` owns arbitrary key-value config with cascading scope; `theme` owns
the specific **design-token vocabulary** (colors, spacing, typography, radius,
shadow, motion) with preset-selection + tenant-override semantics.

Distinct from three neighbours that share adjacent turf:

- **`branding`** owns STATIC assets — logo, favicon, brand name, OG-image seeds.
  A logo is a file, not a token.
- **`settings`** owns arbitrary key-value config with `system → tenant → user`
  cascade. A theme token is a specific vocabulary entry, not free-form config.
- **`storage`** owns the file substrate branding assets are stored on. Theme
  emits no files of its own.

## 1. Entities

| Entity               | ULID   | Description                                                                                                                                 |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `Theme`              | `thm_` | Per-tenant active theme record. Carries `selected_preset_id` + immutable `tokens_snapshot` + `mode` (light/dark) + `accessibility_flags`.   |
| `ThemePreset`        | `tps_` | Pre-built theme config. `tenant_id` NULL = platform-provided preset (6 seeded day-1); non-null = tenant-authored custom preset.             |
| `ThemeTokenOverride` | `tto_` | Per-tenant custom token override on top of a preset. `{token_key, token_value, token_type}` sparse patch applied in the resolution cascade. |

Exactly one active `Theme` per `(tenant_id, mode)` — enforced by a partial
unique index. A tenant with a light theme + a dark theme carries two rows; the
end user's per-user preference picks which mode is served for that user.

## 2. Design tokens — the vocabulary

Every design token is a namespaced key. Eight categories × N keys:

| Category       | Keys                                                                            | Value type                |
| -------------- | ------------------------------------------------------------------------------- | ------------------------- |
| `color.*`      | `primary.500`, `surface.default`, `text.default`, `border.subtle`, `danger.500` | hex / rgb / hsl / oklch   |
| `spacing.*`    | `0`, `1`, `2`, `3`, `4`, `6`, `8`, `12`, `16`, `24`                             | dimension (px / rem / em) |
| `typography.*` | `body.family`, `body.size.md`, `body.weight.regular`, `heading.family`          | font-family / dimension   |
| `radius.*`     | `none`, `sm`, `md`, `lg`, `xl`, `full`                                          | dimension                 |
| `shadow.*`     | `sm`, `md`, `lg`, `xl`                                                          | box-shadow                |
| `motion.*`     | `duration.fast`, `duration.default`, `duration.slow`, `easing.standard`         | duration / easing         |
| `opacity.*`    | `disabled`, `hover`, `focus`                                                    | 0..1                      |
| `z_index.*`    | `dropdown`, `sticky`, `modal`, `popover`, `toast`                               | integer                   |

The full canonical vocabulary lives in `data/token-vocabulary.json`. Every token
key + value passes `valid_token_key` + `valid_token_value_for_type` before
persistence.

## 3. Resolution cascade

Reads resolve in **three layers**:

```
platform default preset
        ↓  (tenant selects a preset)
tenant preset (either platform-provided or tenant custom)
        ↓  (tenant patches individual tokens)
tenant token overrides
        ↓
final resolved token map → tokens_snapshot on the active Theme
```

Writes target one specific layer:

- **Preset selection** — `POST /api/v1/themes/{theme}/activate` writes a new
  `Theme` row referencing a preset; that row's `tokens_snapshot` freezes the
  resolved map at activation time.
- **Token override** — `POST /api/v1/theme-token-overrides` writes a
  `ThemeTokenOverride` row and dispatches `RegenerateRenderedCssJob` which
  recomputes the parent theme's snapshot.

Immutability is load-bearing: the `tokens_snapshot` never mutates while a theme
is active. Mid-session preset edits never break rendering — they land on a NEW
`Theme` row that becomes active only after the user reloads.

## 4. Day-1 platform preset catalog

Six platform presets ship seeded (all with `tenant_id = NULL`):

| Slug                  | Mode  | Category         | Purpose                                                      |
| --------------------- | ----- | ---------------- | ------------------------------------------------------------ |
| `light-default`       | light | platform_default | Baseline light theme every tenant starts with.               |
| `dark-default`        | dark  | platform_default | Baseline dark theme.                                         |
| `high-contrast-light` | light | high_contrast    | WCAG AAA contrast; larger focus rings.                       |
| `high-contrast-dark`  | dark  | high_contrast    | WCAG AAA dark variant.                                       |
| `brand-forward-blue`  | light | brand_forward    | Bold navy primary — starter for finance / SaaS-style brands. |
| `brand-forward-green` | light | brand_forward    | Bold green primary — starter for sports / wellness brands.   |

Tenants can duplicate any platform preset into a custom preset via
`POST /api/v1/theme-presets/{preset}/duplicate` and edit freely. Custom-preset
count is gated by the `theme_custom_presets` entitlement.

Full catalog with complete token maps lives in `data/preset-catalog.json`.

## 5. Accessibility

Four accessibility flags on `Theme.accessibility_flags` (jsonb):

- **`high_contrast`** — bumps contrast to WCAG AAA; overrides `color.text.*` +
  `color.surface.*` pairs to hit ≥ 7:1 ratios.
- **`reduced_motion`** — zeroes `motion.duration.*` tokens so animations degrade
  to instant transitions. Honors `prefers-reduced-motion` OS setting.
- **`larger_text`** — scales `typography.*.size.*` by +25%. Honors iOS Dynamic
  Type + Android font scaling.
- **`focus_visible_always`** — forces `outline` on every interactive element
  regardless of pointer-vs-keyboard interaction. Compliance with EN 301 549.

The `ContrastAuditor` binding computes WCAG AA (4.5:1) + AAA (7:1) contrast
ratios for every `color.text.*` × `color.surface.*` pair and returns findings.
Findings are **informational, not blocking** — tenants may ship low-contrast
themes; the audit surfaces recommendations via
`ThemeAccessibilityRecommendationNotification` when a preset drops below AA.

## 6. Per-user preference

End users override two theme dimensions per-user without needing admin access:

- **`preferred_mode`** — `auto` (follow OS) / `light` / `dark`.
- **`accessibility_overrides`** — additive on top of tenant defaults
  (`high_contrast=true` per user regardless of tenant default).

Stored in `user::user_theme_preferences` (owned by the user module — theme is
the RESOLVER via the `UserThemePreferenceResolver` binding, not the owner). The
`UserThemePreferenceUpdated` event fires here for observability + activity feed
consumption; the row itself is co-located with the User for GDPR erasure.

## 7. Boot order

Priority **23**. Boots AFTER `foundation` (0), `tenancy` (10), `application`
(8), and `settings` (22). Every downstream tenant-facing UI module reads theme
via `TokenResolver` — the resolver caches per-tenant CSS via the module's own
Redis pattern.

## 8. Cross-cutting invariants

- **Every theme row carries `tenant_id`** via `BelongsToTenant`. Zero
  `application_id`, zero `region_id`, zero `organization_id`, zero `branch_id`,
  zero `scope_node_id` on any theme table. Theme is tenant-level; application
  cascades through `tenant_id → tenants.application_id`.
- **Platform presets have `tenant_id = NULL`** — the ONLY tenant-nullable column
  in the module. Cross-tenant reads of platform presets return the same rows for
  every tenant; writes require the `platform_admin` guard.
- **Tokens_snapshot is immutable** while the parent theme is active. The freeze
  happens in `ThemeObserver::updating` on the `is_active: false → true`
  transition.
- **Presets are validated at write-time.** `PresetValidator` runs the tokens
  jsonb against the canonical vocabulary schema before persistence — unknown
  keys, wrong types, malformed hex codes all refuse the write.
- **The CSS regen fires post-commit.** `RegenerateCssOnThemeActivated` is
  `ShouldDispatchAfterCommit` so a failed cache rebuild never rolls back the
  activation itself.

## 9. Non-goals

- **No static asset management.** Branding module owns logo / favicon / brand
  name — theme owns tokens only.
- **No arbitrary key-value config.** Settings module owns free-form
  configuration — theme owns the specific design-token vocabulary.
- **No per-user theme creation.** Users PICK themes + set accessibility
  preferences; theme + preset creation is admin-only.
- **No component-library theming.** Themes ship design TOKENS (values), not
  component STRUCTURE. Component behavior lives in `@stackra/ui`.
- **No third-party design system integrations** (Figma sync, Style Dictionary
  round-trip) at v1 — self-contained.
- **No `region_id` / `organization_id` / `branch_id` / `scope_node_id` on any
  theme row.** These would be shortcut FKs; theme is tenant-level. Related rules
  in `.kiro/steering/tenancy-columns.md` §5.

## 10. Related

- `../README.md` — platform tier index.
- `../branding/readme.md` — sibling static-asset module.
- `../settings/readme.md` — sibling arbitrary-config module.
- `.kiro/steering/hierarchy.md` §5 — scope substrate (theme is a config-plane
  consumer, not a scope-substrate owner).
- `.kiro/steering/tenancy-columns.md` §3 + §5 — the row-level attribution
  contract theme satisfies.
