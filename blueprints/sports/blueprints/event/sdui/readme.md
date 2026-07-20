# event — SDUI blueprints

## Surfaces

### `resources/event/`

Tenant-facing Event management.

- `list.screen.json` — filterable table. Columns: name, event_type,
  starts_at, ends_at, status chip, visibility chip, primary_facility,
  registered_count, is_livestreamed indicator. Filters: status,
  event_type, visibility, organization, branch, season, primary_sport_key,
  gender_category, has_livestream, has_prize_pool, date range. Row
  actions: view, edit, announce, open/close registration, start,
  complete, cancel, archive, publish/unpublish, manage facilities,
  manage livestream.
- `create.screen.json` — multi-card form. Card 1: identity (name,
  slug, scoping tuple — org required, branch optional, season optional,
  primary_sport_key optional). Card 2: type + format (event_type
  required, format filtered by compatible types). Card 3: schedule
  (starts_at, ends_at, timezone, registration_opens_at,
  registration_closes_at). Card 4: eligibility (min_age, max_age,
  age_group_ids, gender_category, max_participants, max_teams). Card 5:
  pricing (entry_fee_cents + currency, allow_late_registration +
  late_registration_fee_cents, prize_pool — entitlement-gated). Card 6:
  presentation (visibility, description, hero_image_url, rules_document_url,
  livestream — entitlement-gated, sponsors — entitlement-gated).
- `edit.screen.json` — same six cards. Scoping tuple (org) read-only
  (immutable post-create). Dates edit shows the events.dates.shift
  warning when status != draft. Pricing edit shows the
  events.pricing.change warning post-registration_open. Eligibility
  narrowing shows the events.eligibility.narrow warning +
  excluded-registrants preview.
- `facilities.screen.json` — event_facilities management. Attach /
  detach / set-primary. Shows conflict warnings when the facility's
  blackouts overlap the event window.

### `widgets/`

- `event-picker.widget.json` — HeroUI `ComboBox` filtered by tenant +
  optional org / branch / season / status / event_type. Groups by
  status (in_progress first, then registration_open, then announced,
  then upcoming, then completed).
- `event-status-chip.widget.json` — compact status chip with color-coded
  variant.
- `event-visibility-chip.widget.json` — compact visibility chip
  (public=success, tenant_only=neutral, participants_only=info,
  private=warning).
- `event-registration-countdown.widget.json` — live countdown to
  registration_opens_at / registration_closes_at.
- `event-facility-preview.widget.json` — card showing the primary
  facility + linked-facility count with a "manage" action.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox` per the `ui-components.md` rule.
Free-text search is essential when the event catalogue grows past a
handful — a large sports academy might run 100+ events per season.
