# sports-registry — SDUI blueprints

## Surfaces

### `resources/sport/`

Tenant-facing Sport catalog management.

- `list.screen.json` — filterable + sortable table showing the merged catalog
  (platform-seeded + own tenant customs). Columns: sport chip (name + color +
  icon), category, governing_body, is_platform_seeded chip, is_active chip,
  discipline_count, downstream_reference_count. Filters: category,
  gender_typical, is_platform_seeded (platform / custom / all), is_active. Row
  actions: view, edit (custom only), deactivate/reactivate (custom only),
  create-discipline (jump to the disciplines page filtered by this sport).
- `create.screen.json` — 3-card form. Card 1: identity (name + slug + category).
  Card 2: metadata (description, governing_body, gender_typical,
  age_range_min/max). Card 3: presentation (primary_color, icon, sort_order).
  Enterprise-only; hidden entirely for Small + Medium tiers (the button is
  disabled with an upgrade prompt).
- `edit.screen.json` — same three cards as create, BUT `slug`, `category`,
  `is_platform_seeded`, `tenant_id` are read-only fields (post-create
  immutable). Every field on a platform-seeded row is read-only on the tenant
  plane (a warning banner explains).
- `show.screen.json` — read-only detail with nested Disciplines + Positions
  tables + downstream reference summary + audit trail snippet.

### `resources/discipline/`

Tenant-facing Discipline catalog management.

- `list.screen.json` — grouped by parent Sport. Columns: name + slug,
  format_type, player_count_range, session_duration_default_minutes,
  is_platform_seeded, is_active, position_count. Filters: sport_id (via the
  sport-picker widget), format_type, is_platform_seeded, is_active.
- `create.screen.json` — parent Sport picker + identity + player counts +
  session duration.
- `edit.screen.json` — sport_id + slug + is_platform_seeded read-only.

### `resources/position/`

Tenant-facing Position catalog management.

- `list.screen.json` — grouped by parent Discipline. Columns: name + slug,
  is_field_position, is_offensive/is_defensive chip, jersey_range,
  is_platform_seeded, is_active. Filters: discipline_id, is_field_position.
- `create.screen.json` — parent Discipline picker + identity + role flags.
- `edit.screen.json` — discipline_id + slug read-only.

### `widgets/`

- `sport-picker.widget.json` — HeroUI `ComboBox` (per the ui-components rule —
  searchable single-select is essential across a 30+ sport catalog). Options
  group by category via `ListBox.Section`. Filters to `filter[is_active]=true`
  by default. Consumed by every Wave 3 form that writes a `sport_key`: Team
  create/edit, AthleteEnrollment, Coach, Event, Session,
  Facility.compatible_sport_keys (as a multi-select variant).
- `discipline-picker.widget.json` — `ComboBox` filtered by parent sport_key.
  Consumed by AthleteEnrollment, Event, Team.
- `position-picker.widget.json` — `ComboBox` filtered by parent discipline_key.
  Consumed by AthleteEnrollment.
- `sport-chip.widget.json` — compact display chip showing sport icon + name +
  optional category. Rendered in Team detail, AthleteEnrollment cards, Event
  listings, roster rows, everywhere a sport_key needs a human-readable label.

## Notes on `ComboBox` over `Select`

Every picker on this module uses HeroUI `ComboBox` — not `Select` — per the
`ui-components.md` rule. Reasoning:

- **Sport-picker** — 30+ platform sports on every tenant, plus Enterprise
  customs. Search is essential from day one.
- **Discipline-picker** — sports like football have 4+ disciplines; the
  parent-filter narrows the list but search remains valuable.
- **Position-picker** — American football alone has 8+ positions on the seeded
  catalog. Search wins.

`ComboBox` API differences from `Select` matter here:

| Concern          | `Select`                    | `ComboBox`                                   |
| ---------------- | --------------------------- | -------------------------------------------- |
| Controlled value | `value` / `onChange`        | `selectedKey` / `onSelectionChange`          |
| Change payload   | `Key \| Key[] \| null`      | `Key \| null` (single)                       |
| Trigger anatomy  | `Select.Trigger` + `.Value` | `ComboBox.InputGroup` → `Input` + `.Trigger` |

## Entitlement-driven rendering

The create + edit screens check the tenant's active entitlements before
rendering the write surfaces:

- The "Create sport" button on the list screen is disabled + shows a "Enterprise
  required" chip when `entitlements.sports_registry_custom=false` (Small +
  Medium tiers).
- All fields on a platform-seeded row are disabled + show a read-only banner
  regardless of tier — platform rows are strictly read-only on the tenant plane.
- The `sport_key` field on downstream Wave 3 forms (Team, Enrollment, etc.)
  never sees the "add new" affordance — those flows read the catalog only.

## Youth-safeguarding rendering

Sports with `age_range_max <= 17` render a subtle youth-safeguarding chip in the
picker + detail views (they'll typically be youth-adjacent programmes like
`general_recreation_pe` for schools). The signal is advisory; the actual
safeguarding gate lives on `AgeGroup.is_youth`.

## Downstream reference guardrail rendering

The deactivate-preview modal on `list.screen.json` shows the row's
`downstream_reference_count` prominently. When count > 0, the "Deactivate"
button is disabled with a clear explanation — the tenant must migrate downstream
references first. The `SPORT_REFERENCE_IN_USE` error surface mirrors this in the
API response.
