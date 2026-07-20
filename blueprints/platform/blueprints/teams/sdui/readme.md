# teams — SDUI blueprints

## Surfaces

### `resources/team/`

Tenant-facing team catalogue management. Coach + branch_manager + admin + owner.

- `list.screen.json` — filterable card grid; team_slot entitlement usage bar at
  top; branch-scope narrowing via scope switcher.
- `create.screen.json` — multi-step create wizard: basics → eligibility →
  schedule → confirm.
- `edit.screen.json` — same fields as create, minus organization_id + branch_id
  (immutable).
- `roster.screen.json` — team detail with live-updating roster (mounted
  `team.{teamId}.members` broadcast channel).
- `schedule.screen.json` — dedicated schedule editor tab (weekly pattern;
  change-impact preview).

### `resources/team-member/`

Roster management within a team. Coach + branch_manager+.

- `list.screen.json` — filterable list; status chips; role-on-team chip; jersey
  number.
- `create.screen.json` — polymorphic-aware add-member flow; member-type picker +
  typed picker per branch.
- `edit.screen.json` — edit role / jersey / position / notes for an existing
  roster row.

### `resources/team-trial/`

Trial workflow. Coach + branch_manager+. Medium+ tier only.

- `list.screen.json` — trial-pipeline board grouped by status (scheduled →
  in_progress → completed → converted/rejected).
- `schedule.screen.json` — schedule a new trial (athlete/user/anonymous picker).
- `evaluate.screen.json` — the coach's evaluation form (evaluation_notes +
  convert/reject action).
- `decision.screen.json` — separate convert / reject confirmation modal with
  decision_notes.

### `resources/event-team/`

Event participation. Coach + branch_manager+. Medium+ tier only.

- `list.screen.json` — team's event participations.
- `register.screen.json` — register team to an event (event_id nullable
  pre-Wave-3).
- `check-in.screen.json` — check-in flow with attendance_count entry.
- `record-result.screen.json` — result JSONB editor (score / position / points /
  outcome).

### `widgets/`

- `team-picker.widget.json` — filterable team select widget. Used from anywhere
  that needs to pick a team (member-add wizard, trial schedule, event-team
  register).
- `member-role-chip.widget.json` — colour-coded chip for role_on_team.
- `capacity-usage-bar.widget.json` — progress bar showing active roster vs
  capacity + waitlist.
- `trial-status-chip.widget.json` — colour-coded chip for trial.status.
