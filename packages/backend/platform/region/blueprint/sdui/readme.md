# region — SDUI blueprints

## Surfaces

### `resources/region/`

Tenant-facing Region management + tax-config detail.

- `list.screen.json` — filterable + sortable table. Columns: slug, name,
  country_code, currency, timezone, default chip, status chip, sort_order.
  Filters: status, country_code, has_registration_number. Row actions: edit,
  set-default, pause/resume, archive, view tax-config. Uses the shared
  `tax-badge` widget in the tax column.
- `create.screen.json` — 3-card form. Card 1: identity (name + slug +
  country-picker + subdivision). Card 2: commercial (currency + timezone +
  locale + weekend_days + fiscal_year_start_month). Card 3: tax config
  (default_rate_percent + name + inclusive + registration_number, plus the
  entitlement-gated `rates[]` repeatable sub-form). Country picker auto-fills
  the commercial + tax defaults from `data/country-defaults.json` — every field
  the caller edits after auto-fill overrides its default.
- `edit.screen.json` — same three cards as create, BUT `country_code` +
  `currency` are read-only (immutable post-create-with-inbound-rows, documented
  as immutable outright on the SDUI to prevent confusion). The tax_config
  section includes a subtle warning banner: "Editing tax config writes a
  financial-record audit row retained 7 years."
- `tax-config.screen.json` — focused, audit-facing view of a single Region's
  tax_config. Renders default_rate_percent + name + inclusive + rates[] table +
  (when the caller carries `regions.view.tax_registration`) the
  registration_number. Also renders a per-change history strip from the
  `RegionTaxConfigUpdated` audit stream so ops can see what changed when.

### `widgets/`

- `country-picker.widget.json` — HeroUI `ComboBox` (per the ui-components rule —
  searchable single-select is essential across 40+ countries) with every entry
  from `data/country-defaults.json`. Options group by continent (Africa,
  Americas, Asia, Europe, Oceania) via `ListBox.Section`. Selection auto-fills
  the commercial + tax defaults into sibling form fields.
- `region-picker.widget.json` — reusable picker showing regions filtered by
  (tenant, status). Consumed by the branch-create flow (region selection)
  - downstream domain modules. HeroUI `ComboBox` with search on name +
    country_code + slug.
- `timezone-picker.widget.json` — HeroUI `ComboBox` with IANA timezone
  identifiers grouped by continent (`Africa/*`, `America/*`, `Asia/*`,
  `Europe/*`, `Australia/*`, `Pacific/*`). Filterable by search. Consumed by the
  region create + edit screens + the user-preferences settings screen (where a
  user overrides their profile timezone).
- `tax-badge.widget.json` — compact chip showing
  `<currency_symbol> <rate>% <name>` (e.g. "AED 5% VAT", "£ 20% VAT", "$ 0%
  Sales Tax"). Rendered in invoice detail + line items + the region list's tax
  column.

## Notes on `ComboBox` over `Select`

Every picker on this module (country, region, timezone) uses HeroUI `ComboBox` —
not `Select` — per the `ui-components.md` rule. Reasoning:

- **Country picker** — 40+ options that will grow. Search is essential.
- **Region picker** — Enterprise tenants may have unlimited regions. Search is
  essential.
- **Timezone picker** — 400+ IANA identifiers. Free-text search + continent
  grouping is the only sensible UX.

`ComboBox` API differences from `Select` matter here:

| Concern          | `Select`                    | `ComboBox`                                   |
| ---------------- | --------------------------- | -------------------------------------------- |
| Controlled value | `value` / `onChange`        | `selectedKey` / `onSelectionChange`          |
| Change payload   | `Key \| Key[] \| null`      | `Key \| null` (single)                       |
| Trigger anatomy  | `Select.Trigger` + `.Value` | `ComboBox.InputGroup` → `Input` + `.Trigger` |

## Confidential-tier rendering

`tax_config.registration_number` is confidential-tier per `data-classes.json`.
The `edit.screen.json` + `tax-config.screen.json` + `list.screen.json` all check
`me.permissions.includes('regions.view.tax_registration')` before rendering the
field. When the caller lacks the permission, the field shows `••••••••` with a
"You need `regions.view.tax_registration` to see this" tooltip.
