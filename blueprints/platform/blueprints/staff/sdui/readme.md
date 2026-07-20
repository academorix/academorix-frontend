# staff — SDUI blueprints

## Surfaces

### `resources/staff/`

Tenant-facing staff catalogue management. HR + owner + admin + branch_manager
(branch-scoped).

- `list.screen.json` — filterable table with employment_status chips +
  entitlement usage bar + org-chart entry point.
- `hire.screen.json` — multi-step hire wizard: user picker → position/department
  → employment terms → optional compensation → confirm. Compensation step
  conditionally rendered based on `staff.manage.compensation` +
  `staff_compensation_tracking` entitlement.
- `edit.screen.json` — same fields as hire minus user_id + branch_id
  (immutable) + started_at (locked after activation). Compensation + emergency
  contact live on their own sub-screens (permission-gated).
- `compensation.screen.json` — dedicated compensation surface. Renders history +
  edit form. Refuses to load without `staff.view.compensation` +
  `staff_compensation_tracking` entitlement.
- `org-chart.screen.json` — Enterprise-only. Tree visualisation of reports_to
  chain. Uses HeroUI Tree/ListBox primitives.
- `offboard.screen.json` — offboarding wizard: reason + notes → cascade options
  (archive coach? remove team memberships?) → confirm.

### `resources/coach/`

Tenant-facing coach catalogue management. HR + branch_manager + coach themselves
(own row).

- `list.screen.json` — filterable card grid with sport/level filters + rating
  badge (when coach_rating_display entitlement on) + certification-count badge.
- `create.screen.json` — link a Staff to a coach profile: staff picker (filtered
  to employment_status='active', no live Coach row) → sport picker → coaching
  level → optional specialization → confirm.
- `certifications.screen.json` — certification list + add/remove flow + verify
  action (Enterprise-only when coach_certifications_verified entitlement on).
- `availability.screen.json` — day-by-day availability window editor. Uses the
  same shape as facility::availability but distinct field name
  (Coach.availability_pattern vs Facility.availability_json).

### `widgets/`

- `staff-picker.widget.json` — searchable staff selector (used by teams,
  sessions, shifts). Uses HeroUI ComboBox per ui-components rule.
- `coach-picker.widget.json` — same pattern, coach-specific.
- `coach-rating.widget.json` — star rating renderer + rating_count badge.
  Renders nothing when coach_rating_display entitlement is off.
- `certification-badge.widget.json` — chip per certification with
  verified-tick + expiring/expired variant.
- `employment-status-chip.widget.json` — colour-coded chip: pre_hire (blue) /
  active (green) / on_leave (yellow) / suspended (orange) / offboarding (grey) /
  offboarded (grey with strikethrough).
