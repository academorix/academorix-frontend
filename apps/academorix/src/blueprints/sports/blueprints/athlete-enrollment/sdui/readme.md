# athlete-enrollment — SDUI blueprints

## Surfaces

### `resources/athlete-enrollment/`

- `list.screen.json` — filterable enrollment table. Columns: athlete (with
  minor-badge subscript), team, season, status chip, age-group snapshot, payment
  status, enrollment_type. Filters: team, season, status, athlete, is_minor.
  Grouped view option (by status).
- `submit.screen.json` — 3-card enrollment form. Card 1: athlete picker + team
  picker + season picker (season filters teams to those in the season). Card 2:
  enrollment_type + optional trial source + position preference + jersey
  preference. Card 3: pricing + payment status (informational — real payment
  collection is Wave 4).
- `edit.screen.json` — same three cards BUT athlete + team + season + type +
  trial source + age-group snapshot are ALL read-only (immutable). Only
  position/jersey/notes/payment status are editable.

### `widgets/`

- `enrollment-status-chip.widget.json` — status chip with color variant per
  state (submitted=info, payment_pending=warning, consent_pending=warning,
  confirmed=success, active=success solid, completed=primary, withdrawn=neutral,
  expelled=danger, expired=neutral, waitlisted=warning).
- `roster-slot-indicator.widget.json` — compact "N of M" indicator showing
  team's active roster count vs capacity. Color-coded green (< 80% full), yellow
  (80-99%), red (100%).
- `waitlist-position-badge.widget.json` — chip showing "Waitlist #N of M" for
  waitlisted enrollments. Powers the parent-facing dashboard's "your child is #3
  on the waitlist" cue.

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox`. The athlete-picker (from the athlete
module) + team-picker (from teams module) are re-used; this module owns only the
season-picker + enrollment-type-picker.

## Atomicity + capacity affordances

The submit screen surfaces two important pre-submit signals:

- Team capacity: When the target team is at capacity, the submit button shows a
  warning + "You'll be placed on the waitlist" (Medium+) or disables the button
  entirely (Small).
- Consent required: When the athlete is a minor + consents are missing, an
  inline warning appears + the form prompts the guardian to record consents
  FIRST (deep-links to /athletes/{athlete}/consents).

## Minor-safeguarding rendering

- Every enrollment row for a MINOR athlete shows the minor-badge subscript.
- Coach notes are stripped from the parent-facing view (guardians never see
  coach_notes).
