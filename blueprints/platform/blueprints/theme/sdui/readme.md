# theme — SDUI blueprints

The tenant admin theme UI is fully data-driven off the module's HTTP surface.
Three resource surfaces + three reusable widgets.

## Surfaces

### `resources/theme/`

Manage active + historical themes for the tenant.

- `list.screen.json` — grid of themes per mode; highlights the active theme +
  offers Activate / Preview / Delete action buttons per row.
- `create.screen.json` — new-theme form. Pick preset + set mode + configure
  accessibility flags. Submits `POST /api/v1/themes`.
- `activate.screen.json` — confirmation screen for `POST
  /api/v1/themes/{theme}/activate`. Shows the diff between current + candidate
  activations (which color pairs change, which overrides land).
- `preview.screen.json` — dry-run preview panel calling `POST
  /api/v1/themes/{theme}/preview`. Renders the compiled CSS + contrast audit
  findings + accessibility flag preview side-by-side.

### `resources/theme-preset/`

Manage the tenant's custom preset library (readable also lists platform
presets).

- `list.screen.json` — filterable preset picker. Filters: mode, category,
  platform vs custom.
- `create.screen.json` — new preset form. Starts from a source preset via the
  duplicate mechanism (never from scratch — every preset must cover the full
  vocabulary).
- `duplicate.screen.json` — clone-a-preset flow. Enter slug + name; the token
  editor opens on the resulting new preset.

### `resources/theme-token-override/`

Per-theme token override management.

- `list.screen.json` — table of overrides for a theme with token_key,
  token_value, token_type columns + delete action per row.
- `edit.screen.json` — token override form. Auto-fills token_type from the
  key, validates value against the type schema.

### `widgets/`

- `token-badge.widget.json` — a compact color-swatch + spacing-ruler + font
  sample widget used to render one token value inline. Reused across every
  screen that lists tokens.
- `preset-thumbnail.widget.json` — 1200×630 preset preview thumbnail with
  loading state + placeholder fallback (color swatch derived from
  `color.primary.500` when the thumbnail is missing).
- `mode-switcher.widget.json` — light/dark/auto radio group + accessibility
  flag checkboxes. Reused on the theme-edit + `/me/theme-preference` screens.
