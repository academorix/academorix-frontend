# platform-user — SDUI blueprints

## Surfaces

Every SDUI screen here mounts on the `platform-admin` host + requires
authentication on the `platform_admin` guard. There is NO tenant-host SDUI in
this module.

### `resources/platform-user/`

Platform-admin CRUD for Stackra staff.

- `list.screen.json` — filterable by department / status / employment_type;
  search on display_name + email fingerprint (when caller has viewPii). Shows
  reports_count + on-call-shift status inline. Excludes offboarded rows unless
  `include_offboarded=true`.
- `show.screen.json` — full detail: profile card, employment history, direct
  reports tree, current + upcoming on-call shifts, audit-trail preview (last 30
  rows).
- `hire.screen.json` — form for the hire flow. Validates that the referenced
  Identity has MFA enrolled + email verified before submit. Composes the
  HirePlatformUserInput payload.
- `offboard.screen.json` — offboard confirmation dialog. Requires reason (min 20
  chars) + optional effective_at. Displays the reassignment-required warning
  when target has direct reports.

### `resources/platform-profile/`

Self-service profile management.

- `me.screen.json` — read + update own profile. first_name + last_name are
  displayed read-only (HR-controlled). Other fields are editable inline.

### `widgets/`

- `on-call-current.widget.json` — sidebar widget on the platform-admin
  dashboard. Shows the currently-on-call PlatformUser + department + shift
  remaining. Refreshes every 60s (matches the OnCallResolver cache TTL).
- `platform-user-avatar.widget.json` — compact avatar-with-tooltip. Consumed in
  audit-trail rows, direct-reports lists, on-call rotation displays.
- `platform-user-status-chip.widget.json` — colour-coded chip for the four
  status values (pending / active / suspended / offboarded).
- `offboarding-sla-tracker.widget.json` — countdown timer widget for the ops
  dashboard. Reads the `platform-user:offboarding-sla-check` scheduled task's
  output; shows any in-flight offboarding still awaiting revocation completion.

## SDUI patterns

- Every mutating action carries a `confirm` prop with a jargon-free description
  of what changes. No silent state changes on this plane.
- PII fields render redacted-by-default; the UI shows a `Show PII` button next
  to the field that requests unmute via a signed challenge (writes the
  meta-audit row server-side).
- Permission-gated buttons render as `null` when the caller lacks the ability —
  no disabled dead controls in the platform-admin UI.
- The confirm-copy for offboard action explicitly names the 24h SLA + 90-day
  retention window so the invoking super_admin cannot claim ambiguity.
