# attendance — changelog

## [Unreleased] — inception (Wave 7)

- Attendance module authored. Four owned entities:
  - `AttendanceRecord` (`atd_`) — per-athlete-per-session check-in event with atomic Pass consumption.
  - `AttendancePolicy` (`apo_`) — per-branch OR per-plan attendance rules (grace period, no-show fee, freeze thresholds, late-arrival penalty pattern).
  - `AbsenceRecord` (`abs_`) — per-athlete-per-session absence event (excused / unexcused / advance-notified / vacation / medical / bereavement).
  - `LateArrival` (`lat_`) — per-attendance-record satellite tracking minutes-late + policy + penalty applied.
- Nine entitlement gates:
  - `attendance_capture` (Small+) — master.
  - `attendance_self_kiosk` (Small+) — kiosk self-check-in.
  - `attendance_geofence` (Medium+) — GPS/geofence-verified check-ins.
  - `attendance_qr_scan` (Small+) — QR-code check-ins.
  - `attendance_advanced_policies` (Medium+) — per-plan attendance policies.
  - `attendance_no_show_fees` (Medium+) — auto-invoice for no-shows.
  - `attendance_freeze_enforcement` (Small+) — auto-freeze membership on threshold.
  - `attendance_analytics` (Medium+) — attendance-rate reports.
  - `attendance_extended_retention` (Enterprise) — 7y → 10y retention for compliance holds.
- Attendance state machine — status transitions: not_yet_checked_in → present / late; present → left_early / present_with_note; late → left_early / present_with_note.
- Absence state machine — unexcused → excused / no_show_advance_notice_given; excused → unexcused (admin reversal).
- Load-bearing invariants:
  - One AttendanceRecord per (session, athlete) via partial unique index.
  - One AbsenceRecord per (session, athlete) via partial unique index.
  - ATOMIC PASS CONSUMPTION on check-in: AttendanceRecord create + Pass.consume() in the same DB transaction with SELECT ... FOR UPDATE.
  - No AttendanceRecord AND AbsenceRecord can co-exist for the same (session, athlete) — mutual exclusion.
- Load-bearing flow: check-in orchestrator validates enrollment → resolves policy → atomic pass consume → attendance record → optional late-arrival → emit AttendanceRecorded.
- Absence detection: nightly ReconcileAttendanceJob sweeps expected attendees for completed sessions + creates AbsenceRecord (status='unexcused') for missing check-ins.
- Absence freeze cascade: EvaluateAbsenceThresholdOnAbsenceRecorded hook computes rolling-window unexcused count → fires AbsenceFreezeThresholdReached (P1) → FreezeMembershipOnThresholdReached hook pauses membership via `membership::MembershipObserver.setStatus('paused')`.
- Guardian self-report path: `POST /absences/report` accepts pre-notification; auto-excused when reported > 24h in advance per policy.auto_excuse_reasons.
- Late-arrival penalty patterns: none / consume_pass_anyway / fractional_pass_consume / notify_only — selected by policy.late_arrival_penalty_type.
- Cascade paths:
  - SessionArchived → refuse when attendance records exist.
  - SessionCancelled → AttendanceCancelled on every record; consumed passes refunded.
  - EnrollmentWithdrawn → refuse hard-delete when attendance references remain.
  - MembershipLapsed → future check-ins refuse with ATTENDANCE_NO_ACTIVE_PASS.
  - TenantErased → cascade delete via FK.
- Retention: 7 years post-session for attendance (10y Enterprise); 3 years for absence; co-terminous for late-arrival.
- 16 published events including load-bearing AttendanceRecorded + P1 AbsenceFreezeThresholdReached.
- 9 notification categories including cannot-opt-out AbsenceFreezeThresholdReachedNotification.
- Five broadcast channels: tenant / session / athlete / user / coach.
- SDUI: 12 screens (attendance list/check-in/check-out/cancel + policy list/create/activate + absence list/excuse/report + late-arrival list + coach-session-roster + reports/attendance + kiosk-check-in-app) + 4 widgets (attendance-status-chip / check-in-method-badge / absence-reason-picker / lateness-indicator).
- Seven scheduled jobs (Reconcile / NotifyAbsence / CheckFreezeThreshold / ChargeNoShowFee / ConsumePassAtomically / CleanupOrphanCheckins / GenerateAttendanceReport).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `branch`, `sports/athlete`, `sports/athlete-enrollment`, `sports/season`, `sports/event`, `sports/session`, `sports/coaching`, `finance/membership`, `staff`.
- Extended by NONE. Planned consumers: growth::analytics, notifications, sports/progress.

### Design notes

- No `application_id` / `region_id` / `organization_id` / `scope_node_id` on any attendance table. Application cascades through tenant; region + organization cascade through branch.
- `attendance_records`: tenant_id + session_id + athlete_id + athlete_enrollment_id + consumed_pass_id (once set) are IMMUTABLE post-create.
- `absence_records`: tenant_id + session_id + athlete_id + athlete_enrollment_id are IMMUTABLE post-create.
- `attendance_policies`: composite unique on (tenant_id, branch_id, membership_plan_id) with predicate `is_active=true` — one active policy per specificity.
- Atomic Pass consumption is THE load-bearing correctness property. Every AttendanceOrchestrator failure that leaves attendance without a pass consumption (or a consumed pass without attendance) is a P1 signal from `ReconcileOrphanCheckinsJob`.
- Guardian self-report auto-excuses only when the reason is in policy.auto_excuse_reasons AND reported > 24h in advance.
- Post-session correction window: attendance status can be edited within 48h of session.ends_at; after that, corrections require admin override with reason.
- COPPA compliance: minor athlete kiosk check-in requires guardian consent for device_fingerprint + GPS capture.
- Attendance analytics NEVER carry raw device_fingerprint_hash or ip_address — analytics events bucket the fraud signals into aggregated flags.

### ULID prefix registration

- `atd_` (AttendanceRecord), `apo_` (AttendancePolicy), `abs_` (AbsenceRecord), `lat_` (LateArrival) — new. Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. 3-char lowercase.

### Wave 7 → future migration notes

- Wave 8+ growth::analytics reads AttendanceRecorded / AbsenceRecorded via the emitted queue events for pattern detection.
- Wave 8+ sports/progress module reads attendance rate as a factor in progress tracking.
- Future biometric integration would extend AttendanceRecord with `biometric_signature_hash` + `biometric_provider` — deferred pending regulatory guidance on youth biometrics.
