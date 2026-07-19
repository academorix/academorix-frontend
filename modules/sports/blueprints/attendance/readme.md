# attendance

The Attendance lane. Answers _"did this athlete show up at this session, when,
and did they use a pass?"_. Wave 7 sports-domain module.

## 1. What this module owns

| Concern                          | Owned artefact                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Check-in event                   | `AttendanceRecord` (`atd_`) — one row per (athlete, session). Carries checked_in_at + checked_in_via + status + optional consumed_pass_id + device fingerprint + IP + GPS.            |
| Policy rules                     | `AttendancePolicy` (`apo_`) — per-branch OR per-plan enforcement rules: grace_period_minutes, no_show_fee_cents, max_unexcused_absences_per_period, late-arrival penalty pattern.     |
| Absence event                    | `AbsenceRecord` (`abs_`) — one row per (athlete, session) where the athlete didn't attend an expected session. Status IN unexcused / excused / no_show_advance_notice_given / vacation. |
| Late-arrival satellite           | `LateArrival` (`lat_`) — per-attendance-record satellite when status='late'. Tracks minutes_late + which policy applied + penalty_applied.                                            |

### 1.1 The four owned tables

- `attendance_records` — carries `tenant_id` (CASCADE) + `session_id` (RESTRICT) + `athlete_id` (RESTRICT) + `athlete_enrollment_id` (RESTRICT) + optional `consumed_pass_id` (RESTRICT) + optional `membership_id` (RESTRICT) + optional `checked_in_by_user_id` (RESTRICT).
- `attendance_policies` — carries `tenant_id` (CASCADE) + optional `branch_id` (RESTRICT) + optional `membership_plan_id` (RESTRICT).
- `absence_records` — carries `tenant_id` (CASCADE) + `session_id` (RESTRICT) + `athlete_id` (RESTRICT) + `athlete_enrollment_id` (RESTRICT) + optional `reported_by_user_id` (RESTRICT) + optional `excused_by_user_id` (RESTRICT).
- `late_arrivals` — carries `tenant_id` (CASCADE) + `attendance_record_id` (RESTRICT) + denormalised `session_id` + `athlete_id` + optional `policy_id` (RESTRICT).

None carry `application_id` (cascades through `tenant_id → tenants.application_id`), `region_id`, `organization_id`, or `scope_node_id`. These are FORBIDDEN per `tenancy-columns.md` §5.

## 2. Tier gating

`attendance_capture` is the master feature key — on every tier because every academy needs check-in. Nine entitlement keys shape the surface:

- **Small** — kiosk self-check-in + QR scan + membership freeze enforcement. Base attendance capture.
- **Medium** — geofence-verified check-in + per-plan attendance policies + no-show fee auto-invoicing + attendance analytics.
- **Enterprise** — extended retention (7y → 10y) for compliance holds.

## 3. The check-in orchestration

The critical flow — a single check-in request atomically consumes a Pass, records the attendance, and (if applicable) records a late-arrival:

```
POST /api/v1/attendance/check-in { session_id, athlete_id, checked_in_via }
        │
        ▼
attendance.rate_limit middleware        — 5 attempts / minute per (athlete, session) per source
attendance.geofence_verify (if enabled) — validates gps_lat + gps_lng vs session.venue_geofence
        │
        ▼
AttendanceRecordObserver.creating (transactional):
  1. Validate athlete.tenant_id + session.tenant_id + enrollment.tenant_id all match
  2. Validate athlete has active AthleteEnrollment for (team, season) of the session
  3. Resolve applicable AttendancePolicy (§4)
  4. If session.requires_pass AND membership exists:
        SELECT ... FOR UPDATE the earliest unconsumed Pass in the membership's period
        If no Pass available → 409 ATTENDANCE_NO_ACTIVE_PASS
        Set consumed_pass_id + membership_id
  5. Compute status from (session.starts_at + policy.grace_period_minutes vs checked_in_at)
        - checked_in <= starts_at + grace → 'present'
        - checked_in > starts_at + grace  → 'late'
  6. Fire ConsumePassAtomicallyOnAttendanceCreated hook:
        - UPDATE passes SET consumed_at = attendance.checked_in_at,
                             consumed_by_session_id = attendance.session_id
          WHERE id = consumed_pass_id AND consumed_at IS NULL
        - If 0 rows updated → rollback + 409 ATTENDANCE_PASS_ALREADY_CONSUMED
  7. Fire AttendanceRecorded (queued cascade → analytics + notifications)
  8. If status='late': create LateArrival + fire LateArrivalRecorded
```

Everything is in ONE DB transaction. Failure at any step rolls back both the attendance row and the pass consumption.

## 4. Policy resolution

`PolicyResolver` returns the applicable policy for a check-in via nearest-match cascade:

```
For a check-in at (branch=B, session's team plan=P):

  1. Try SELECT policy WHERE branch_id=B AND membership_plan_id=P AND is_active=true
  2. Fallback SELECT policy WHERE branch_id=B AND membership_plan_id IS NULL AND is_active=true
  3. Fallback SELECT policy WHERE branch_id IS NULL AND membership_plan_id IS NULL AND is_active=true
  4. Fallback → config('attendance.defaults') (grace_period=15, late_after=30, max_absences=3, freeze_period_days=30)
```

Composite unique on `(tenant_id, branch_id, membership_plan_id) WHERE is_active=true` prevents overlapping active policies at the same specificity.

## 5. Absence detection

`ReconcileAttendanceJob` runs nightly at 03:00 tenant-local time. For each Session past `ends_at` on that day:

```
For each expected athlete on the session (via active AthleteEnrollment on the team+season):
  If EXISTS AttendanceRecord for (session, athlete) → skip (attended)
  If EXISTS AbsenceRecord for (session, athlete) → skip (already reported by guardian)
  Else → INSERT AbsenceRecord with status='unexcused', reported_at=now(),
         reported_by_user_id=NULL (system-detected)
         Fire AbsenceRecorded
```

After creation, `EvaluateAbsenceThresholdOnAbsenceRecorded` hook runs the rolling-window check against the athlete's applicable policy and, if the threshold is crossed, dispatches `AbsenceFreezeThresholdReached` (P1) which pauses the membership via the finance module.

## 6. Guardian self-report path

Guardians can pre-notify absences via `POST /api/v1/absences/report`:

- If reported > 24h before session.starts_at (per policy) → auto-excused, status='no_show_advance_notice_given', counted_toward_freeze=false.
- Otherwise → status='unexcused' initially; admin can excuse later via `POST /absences/{absence}/excuse`.

Auto-excuse reasons declared in the policy (`auto_excuse_reasons` JSONB array, e.g. `["medical_documented", "family_emergency_notified"]`) flip the initial status to `excused` when a matching reason is supplied.

## 7. Late-arrival penalty patterns

`AttendancePolicy.late_arrival_penalty_type` selects the enforcement pattern:

| Pattern                    | Behaviour                                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `none`                     | Late arrival is logged (LateArrival row) but no consequence.                                                          |
| `consume_pass_anyway`      | Pass is consumed at full value. LateArrival row records for coaching feedback.                                        |
| `fractional_pass_consume`  | Pass is marked half-consumed via `metadata.fractional=0.5` — a full pass grants two half-consumptions this period.    |
| `notify_only`              | No pass consumption; notifies guardian + coach via LateArrivalNotification. Pass stays available.                     |

## 8. Cascades

- `sports/session::SessionArchived` → `PreventSessionArchiveWithActiveAttendance` refuses when attendance records exist for the session. Historical rows survive; the session cannot be archived out from under them.
- `sports/session::SessionCancelled` → `AttendanceCancelled` fires on every existing AttendanceRecord for the session, releasing any consumed Pass back to the membership pool.
- `athlete-enrollment::EnrollmentWithdrawn` → `PreventEnrollmentArchiveWithActiveAttendance` refuses hard-delete; existing attendance rows continue to exist but no new attendance can be recorded.
- `finance::MembershipLapsed` → membership passes expire; future check-ins for that athlete on that plan refuse with `ATTENDANCE_NO_ACTIVE_PASS` until membership is reactivated.
- `tenancy::TenantErased` → cascade delete via FK. Attendance records under regulator hold survive per retention rules.

## 9. Retention

- Attendance records: 7 years post-session; 10 years Enterprise via `attendance_extended_retention` entitlement.
- Attendance policies: retained while active + 7 years post-archive.
- Absence records: 3 years post-session.
- Late arrivals: co-terminous with parent AttendanceRecord.
- On `TenantErased`, records under a regulator's hold survive as compliance archive rows managed by the compliance module.

## 10. Fraud prevention on self-kiosk check-ins

`AttendanceRecord.checked_in_via='self_kiosk'` OR `'qr_scan'` MUST carry:

- `device_fingerprint_hash` (SHA-256 of a client-side fingerprint) — persisted so admin can spot patterns of a single device impersonating multiple athletes.
- `ip_address` (inet) — correlation across suspicious check-ins.
- For `checked_in_via='geofence'` — `gps_lat` + `gps_lng` MUST validate within `session.venue_geofence_radius` (integrates with `products/geofencing` module).

Kiosk check-in requires COPPA-compliant guardian consent for the device_fingerprint + GPS capture when the athlete is a minor. This consent lives on the parent `Athlete.consent_snapshot` and is refused at check-in time if missing.

## 11. What this module does NOT do

- **Fingerprint biometrics.** v1 uses hashed device fingerprints only. Real biometric hardware is a future concern.
- **Facial recognition.** Privacy + regulatory complexity out of scope for v1.
- **Session scheduling.** That's `sports/session`. Attendance ONLY records what happened.
- **Coach-of-athlete direct messaging via check-in.** That's `notifications` — attendance fires events, notifications sends messages.
- **Attendance-based ranking / leaderboards.** That's `growth::analytics` reading the emitted metrics.
- **Cross-tenant attendance reporting.** Every attendance query is tenant-scoped.

## 12. Cross-references

- `hierarchy.md` §1a — canonical vocabulary (Athlete, Session, Coach).
- `hierarchy.md` §14 — belongs-to matrix (AttendanceRecord → Tenant + Session + Athlete + AthleteEnrollment + Pass).
- `tenancy-columns.md` §3 + §5 — attendance tables carry `tenant_id` only; forbidden columns list.
- `modules/sports/blueprints/session/` — the parent session module (what's being attended).
- `modules/sports/blueprints/athlete/` — the attendee.
- `modules/sports/blueprints/athlete-enrollment/` — the roster attachment we validate against + canonical style reference for state-machine + atomic-conversion patterns.
- `modules/sports/blueprints/coaching/` — the Coach lane; check-ins may be coach-verified.
- `modules/finance/blueprints/membership/` — Pass consumption + membership freeze cascade.

## 13. ULID prefixes owned

- `atd_` — AttendanceRecord
- `apo_` — AttendancePolicy
- `abs_` — AbsenceRecord
- `lat_` — LateArrival

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. Each 3-char lowercase.

Consumed (referenced via FK): `ten_`, `brn_`, `usr_`, `ath_`, `aen_` (AthleteEnrollment), `ses_` (Session), `pss_` (Pass), `mbr_` (Membership), `mbp_` (MembershipPlan), `stf_` (Staff — coaches).
