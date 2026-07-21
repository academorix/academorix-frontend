# facility — SDUI blueprints

## Surfaces

### `resources/facility/`

Tenant-facing facility catalogue management. Owner + admin + branch_manager.

- `list.screen.json` — filterable card grid; entitlement usage bar at top;
  branch-scope narrowing via scope switcher.
- `create.screen.json` — multi-step create wizard: basics → availability →
  pricing → confirm. Availability + pricing use pre-loaded samples from `data/`.
- `edit.screen.json` — same fields as create, minus branch_id (immutable).
- `blackouts.screen.json` — dedicated blackout editor tab (add / remove;
  cascade-impact preview).

### `resources/resource-booking/`

Tenant-facing booking management. Two audiences: bookers (own bookings) + staff
(all bookings in scope).

- `list.screen.json` — filterable list; status chips; my-bookings default; staff
  sees a "show all" toggle.
- `create-slot-picker.screen.json` — calendar-driven slot picker; loads GET
  /available-slots; renders pricing preview.
- `detail.screen.json` — one booking's full view; check-in button when starts_at
  is near; cancel action; reschedule action.

### `resources/day-pass/`

Enterprise-only POS surface. Reception + admin.

- `issue.screen.json` — cash-register-style single-form issue flow;
  user-vs-anonymous toggle; receipt preview.

### `resources/pass/`

Enterprise-only pass ledger.

- `list.screen.json` — filterable list; credit-remaining bar; revoke action.

### `widgets/`

- `available-slots-calendar.widget.json` — the calendar-driven slot picker
  widget. Embedded in create-slot-picker.
- `facility-status-chip.widget.json` — colour-coded chip (active / maintenance /
  retired).
- `booking-status-chip.widget.json` — colour-coded chip (pending / confirmed /
  cancelled / no_show / completed).
- `pass-credits-remaining.widget.json` — progress-bar widget showing used/total
  credits.
