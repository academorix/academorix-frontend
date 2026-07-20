# attendance — SDUI blueprints

## Surfaces

### `resources/attendance-record/`

- `list.screen.json` — filterable attendance table. Columns: athlete (with minor-badge), session name + starts_at, status chip, check-in method badge, checked_in_at, lateness indicator (when late). Filters: branch, team, session, athlete, status, checked_in_via, date range. Powers admin roster + audit views.
- `check-in.screen.json` — the admin-recorded check-in form. Two-card layout: (1) athlete + session picker + method selector; (2) optional fields (checked_in_at override, initial status, notes). Real-time preview shows "will consume Pass X" when session.requires_pass=true.
- `check-out.screen.json` — check-out flow. Loads the athlete's active AttendanceRecord for a session; captures checked_out_at + optional left_early_reason. Auto-computes duration.
- `cancel.screen.json` — cancel-attendance modal. Requires cancellation_reason. Prominent warning: "This will refund the consumed Pass (pss_XXX)".

### `resources/attendance-policy/`

- `list.screen.json` — policy table with specificity indicator chips (plan-scoped / branch-scoped / tenant-wide). Filters: branch, plan, is_active.
- `create.screen.json` — policy creation form with template picker (loads data/policy-template-samples.json — 6 canonical shapes). Cards: (1) name + scope; (2) grace + late-after; (3) penalties + fees; (4) freeze threshold + auto-excuse reasons; (5) notification config.
- `activate.screen.json` — activation modal. Pre-flight check surfaces any policy that would be superseded at the same (branch, plan) specificity; asks for confirmation.

### `resources/absence-record/`

- `list.screen.json` — absence table. Columns: athlete (minor-badge), session, status chip, absence reason, reported source (self / auto-detected / admin), counted-toward-freeze indicator, days-since-reported. Filters: branch, team, athlete, status, counted_toward_freeze, date range.
- `excuse.screen.json` — excusal form. Requires absence_reason (from data/absence-reason-catalog.json picker). Optional: explanation + documented_url_signed upload.
- `report.screen.json` — guardian self-report form. Athlete picker (guardian's own athletes only via .own scope) + session picker + reason picker. Inline "will auto-excuse when reported > 24h in advance" hint.

### `resources/late-arrival/`

- `list.screen.json` — late-arrival table. Columns: athlete, session, minutes late, penalty applied, applicable policy. Filters: branch, team, athlete, minutes-late bucket. Read-only — LateArrival is a satellite entity.

### Extended screens

- `coach-session-roster.screen.json` — coach's session-day dashboard. Live-updating table (WebSocket via session.{sessionId}.attendance) showing each expected athlete with check-in status. One-tap "Verify attendance" per row (checked_in_via='coach_verified'). Post-session: summary of attended / late / absent counts + session-notes field per athlete.
- `reports/attendance.screen.json` — aggregate attendance report. Grouped charts: attendance rate over time (per branch / team / coach / season), absence patterns (excused vs unexcused breakdown), late-arrival trends. Requires attendance_analytics entitlement — surface hides + shows upgrade CTA when not entitled.
- `kiosk-check-in-app.screen.json` — full-screen kiosk mode. Athlete selects self, enters PIN (or scans QR), sees big "You're checked in!" confirmation. Optimised for tablets at the front desk. No admin navigation shown. Rate-limited via attendance.rate_limit middleware.

### `widgets/`

- `attendance-status-chip.widget.json` — status chip with color variant per state.
- `check-in-method-badge.widget.json` — small badge for checked_in_via with icon (kiosk / coach / admin / geofence / QR).
- `absence-reason-picker.widget.json` — reason picker loading data/absence-reason-catalog.json. Renders as HeroUI ComboBox (per ui-components rule — always prefer ComboBox over Select for filterable choice).
- `lateness-indicator.widget.json` — chip showing "N min late" with color scale (< 5 min = neutral, 5-15 = warning, > 15 = danger).

## Notes on `ComboBox` over `Select`

Every picker uses HeroUI `ComboBox` per the ui-components rule. Session-picker (from sports/session module), athlete-picker (from athlete module), and team-picker (from teams module) are re-used; this module owns only the check-in-method-picker + absence-reason-picker.

## Atomicity + capacity affordances

The check-in surfaces surface pre-check-in signals:

- Pass availability: when session.requires_pass=true and no pass is available, the submit button disables with inline warning "This athlete has no unconsumed pass in the current period".
- Consent required: for minors on self_kiosk / geofence / qr_scan paths without device_fingerprint / GPS consent, the check-in refuses with an inline banner "Record consent first" and deep-links to /athletes/{athlete}/consents.
- Rate limit: after 3 attempts in a minute from the same source, a countdown chip appears "Retry in Xs".

## Minor-safeguarding rendering

- Every attendance / absence row for a MINOR athlete shows the minor-badge subscript (from athlete module widget).
- Coach notes (session_notes) are STRIPPED from the guardian-facing views (guardians never see coach_notes).
- Device fingerprint + GPS + IP are STRIPPED from all non-admin views (fraud correlation is admin-only).
- Platform-plane surfaces (support tooling) redact minor names + all fraud signals.

## Kiosk-specific concerns

- The kiosk-check-in-app surface uses a distinct authentication path — a shared kiosk token authenticates the device; individual athletes verify via PIN + fingerprint hash.
- Kiosk sessions log the device fingerprint on EVERY check-in (never persist across sessions — each fingerprint is a per-tap capture).
- COPPA-compliant consent-first flow for minors: the kiosk refuses check-in if the athlete's consent_snapshot lacks device_fingerprint_consent.
- Kiosk UI is optimised for one-handed use + poor lighting (large tap targets, high contrast).
