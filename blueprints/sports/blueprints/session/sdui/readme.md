# session — SDUI blueprints

## Surfaces

### `resources/session/`

Tenant-facing session management.

- `list.screen.json` — filterable table. Columns: name, session_type,
  starts_at + duration (derived from resource_booking), status chip,
  primary_facility, head_coach, checked_in/capacity. Filters:
  status, session_type, team, season, event, branch, head_coach,
  sport_key, date range. Row actions: view, edit, confirm, reschedule,
  cancel, start, complete, manage attendance, view/flag safeguarding.
- `create.screen.json` — multi-card form. Card 1: identity + booking
  picker. Card 2: type + coaches. Card 3: eligibility + capacity.
  Card 4: curriculum + equipment.
- `edit.screen.json` — same four cards. resource_booking_id read-only
  (reschedule uses dedicated endpoint). Coach reassign shows warning
  when <24h before starts + minors registered.
- `attendance.screen.json` — check-in surface. Grid of registered
  athletes with big "Check in" / "Mark absent" / "Mark late" buttons.
  Optimised for touch (coach on tablet during session).
- `today.screen.json` — dashboard widget-style page. All today's
  sessions grouped by branch, with quick check-in buttons.

### `widgets/`

- `session-picker.widget.json` — HeroUI `ComboBox` filtered by tenant
  + optional team + season + event + coach + status.
- `session-status-chip.widget.json` — status chip.
- `session-attendance-summary.widget.json` — inline `X/Y checked in`
  chip.
- `session-safeguarding-flag.widget.json` — visible ONLY to
  admin/owner. Warning chip when safeguarding_incident_flag=true.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox` per `ui-components.md`. Free-text
search is essential for coaches with many concurrent sessions across
teams + weeks.
