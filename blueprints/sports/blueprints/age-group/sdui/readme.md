# age-group — SDUI blueprints

## Surfaces

### `resources/age-group/`

Tenant-facing AgeGroup management.

- `list.screen.json` — filterable + sortable table. Columns: sort_order, name,
  bounds (via the shared `age-group-badge` widget), cutoff_kind, sport_key,
  gender_category, is_youth chip, is_default chip, is_seeded chip, status.
  Filters: is_seeded, sport_key, is_youth, gender_category, status. Row
  actions: edit, edit bounds (separate route + higher permission), edit cutoff
  (same), set-default, archive/restore.
- `create.screen.json` — 3-card form. Card 1: identity (name + slug + optional
  organization_id + optional sport_key). Card 2: bounds + cutoff (min_age +
  max_age + cutoff_date_kind + conditional cutoff_month + cutoff_day depending
  on kind). Card 3: presentation (description + color + gender_category +
  sort_order + is_default toggle).
- `edit.screen.json` — same three cards as create, BUT `organization_id`,
  `sport_key`, and `is_seeded` are read-only (organization + sport_key are
  post-create-immutable; is_seeded is set-by-seeder-only). The bounds section
  includes a subtle warning banner when the row has active downstream
  references: "Editing bounds fires a safeguarding-critical audit event retained
  7 years. Wave 3+ will refuse this edit if it would invalidate enrolled
  athletes."

### `widgets/`

- `age-group-picker.widget.json` — HeroUI `ComboBox` (per the ui-components
  rule — searchable single-select is essential across catalogs that may grow
  to 30+ entries on Enterprise tenants). Options group by youth/adult
  (`ListBox.Section`). Filters to `filter[status]=active` by default. Consumed
  by the Team edit form + AthleteEnrollment form + roster preview widgets.
- `age-group-badge.widget.json` — compact chip showing `<name> · <bounds>`
  (e.g. "U12 · Ages 10-11", "Adult · Ages 18-34"). Rendered in team detail +
  roster rows + enrollment previews. The chip color is driven by the AgeGroup's
  color field; when a group is is_youth=true, a subscript "youth"
  chip renders in the safeguarding-yellow variant.

## Notes on `ComboBox` over `Select`

Every picker on this module (age-group, sport-key, cutoff-kind) uses HeroUI
`ComboBox` — not `Select` — per the `ui-components.md` rule. Reasoning:

- **Age-group picker** — Small tenants have 10 seeded rows; Enterprise
  tenants may add many customs. Search is essential.
- **Sport-key picker** (embedded in create/edit forms) — Wave 3c will introduce
  a formal sports registry with 20+ entries. Search is essential from day one
  so the migration is a no-op.
- **Cutoff-kind picker** — only 4 options, so `Select` would be defensible, but
  we standardise on `ComboBox` to keep every picker consistent + to leave room
  for future kinds without a widget rewrite.

`ComboBox` API differences from `Select` matter here:

| Concern          | `Select`                    | `ComboBox`                                   |
| ---------------- | --------------------------- | -------------------------------------------- |
| Controlled value | `value` / `onChange`        | `selectedKey` / `onSelectionChange`          |
| Change payload   | `Key \| Key[] \| null`      | `Key \| null` (single)                       |
| Trigger anatomy  | `Select.Trigger` + `.Value` | `ComboBox.InputGroup` → `Input` + `.Trigger` |

## Youth-safeguarding rendering

Every screen + widget check `age_group.is_youth` before rendering age-adjacent
content. When true, the badge widget renders the additional "youth" chip in the
safeguarding-yellow variant so the UI signals the row's minor-scoped downstream
consequences at every point of appearance. Consent-flow modals + retention
banners key off the same flag.

## Conditional fields in create.screen.json

The cutoff section conditionally renders `cutoff_month` + `cutoff_day` based on
the current `cutoff_date_kind`:

- `calendar_year` → hide both (must be null)
- `academic_year` → show cutoff_month (1-12); hide cutoff_day (defaults to 1)
- `custom_date` → show both
- `rolling_from_birthday` → hide both (must be null)

The client-side hide keeps the payload clean; the server-side rule
(`valid_cutoff_date`) is the authoritative validator.

## Entitlement-driven rendering

The create + edit screens check the tenant's active entitlements before
rendering fields:

- `sport_key` field is disabled + shows an "Enterprise required" chip when
  `entitlements.age_group_sport_specific=false`
- Bounds fields on a seeded row are disabled + show a "Custom groups required"
  chip when `entitlements.age_group_custom=false` (Small tier can rename but
  not reshape bounds even on seeded rows)
- The "Create custom age group" button on the list screen is disabled + shows
  a slot-usage bar with an upgrade prompt when `age_group_slot.is_exceeded=true`
