# season — SDUI blueprints

## Surfaces

### `resources/season/`

Tenant-facing Season management.

- `list.screen.json` — filterable table. Columns: name, season_type,
  start_date/end_date range, status chip, is_current chip, registration window,
  roster count (once athlete/enrollment modules land). Filters: status,
  season_type, is_current, sport_key. Row actions: view, edit, set-current,
  open/close registration, start, begin playoffs, complete, archive.
- `create.screen.json` — 3-card form. Card 1: identity (name + slug + scoping
  tuple picker + sport_key). Card 2: schedule (start_date, end_date,
  registration windows, competition_starts_at, playoff toggles). Card 3:
  capacity + policy (capacity_target, max_enrollments_per_athlete,
  late-registration policy).
- `edit.screen.json` — same three cards, but scoping tuple (org + branch) is
  read-only (immutable post-create). Dates edit shows `season.dates.shift`
  warning when status != planned.

### `widgets/`

- `season-picker.widget.json` — HeroUI `ComboBox` filtered by tenant + optional
  org + optional branch + optional sport_key. Groups by status (active first,
  then planned, then completed). Consumed by athlete + event + session create
  flows.
- `season-status-chip.widget.json` — compact status chip with color-coded
  variant (planned=neutral, registration_open=info, in_progress=accent,
  playoffs=warning, completed=success, archived=neutral).
- `season-summary.widget.json` — mini card showing name + date range +
  is_current + registration window countdown.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox` — not `Select` — per the `ui-components.md`
rule. Reasoning: Enterprise tenants may run many concurrent seasons across
scopes; free-text search on name + slug is essential.
