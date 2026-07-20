# athlete-enrollment — changelog

## [Unreleased] — inception (Wave 3a)

- AthleteEnrollment module authored. One owned entity:
  - `AthleteEnrollment` (`aen_` prefix) — roster attachment binding Athlete to Team + Season.
- Three entitlement gates:
  - `athlete_enrollment_slot` (per-season cap: Small=15 / Medium=250 / Enterprise=unlimited).
  - `athlete_enrollment_waitlist` (Medium+).
  - `athlete_enrollment_provisional` (Enterprise-only).
- Enrollment state machine: submitted → payment_pending/consent_pending → confirmed → active → completed / withdrawn / expelled / expired / waitlisted → promotion path.
- Load-bearing invariants:
  - One active enrollment per (athlete, team, season) via partial unique index.
  - Jersey number uniqueness per active team roster.
  - ATOMIC CONVERSION to teams::TeamMember when status → active, enforced by ConvertEnrollmentToTeamMemberAtomically hook + ReconcileEnrollmentTeamMemberInvariantJob.
- Age-group snapshot semantics: `age_group_snapshot_id` FROZEN at submission (birthday drift + AgeGroup catalog changes do NOT reshape it).
- Consent snapshot at confirm-time preserves the athlete's consent state for regulator audit.
- Trial conversion path: `enrollment_type='trial_converted'` + `source_trial_id` references originating TeamTrial.
- Cascade paths: AthleteArchived/Withdrawn/Graduated → cascade to enrollments (via cascade=true). TeamArchived + SeasonArchived → refuse when active enrollments exist. SeasonStarted → auto-activate confirmed enrollments. SeasonCompleted → cascade complete active enrollments.
- Retention: terminal enrollments retain 7 years (season-history + federation compliance).
- 20 published events. 12 notification categories.
- Four broadcast channels: tenant / team / athlete / user.
- SDUI: 3 screens (list + submit + edit) + 3 widgets (enrollment-status-chip / roster-slot-indicator / waitlist-position-badge).
- Six scheduled jobs (Activate / PromoteWaitlisted / ExpireProvisional / NotifyDeadlines / Reconcile / Purge).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`, `branch`, `entitlements`, `teams`, `athlete`, `season`, `age-group`.
- Extended by NONE. Planned consumers: event, session, finance, notifications, attendance.

### Design notes

- No `application_id` / `organization_id` / `region_id` / `scope_node_id` on enrollment rows.
- team_id + athlete_id + season_id + branch_id + tenant_id + age_group_snapshot_id + enrollment_type + source_trial_id are IMMUTABLE post-create.
- The atomic conversion invariant is THE load-bearing correctness property. Every EnrollmentAtomicityFailed event is P1.
- Consent snapshot is a POINT-IN-TIME copy — preserves compliance evidence even when the parent Athlete's consents change.
- Position + jersey_number_assigned enforced unique per active team roster.
- Withdrawal + expulsion require reason (anti-discrimination compliance).

### ULID prefix registration

- `aen_` (AthleteEnrollment) — new. Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. 3-char lowercase.

### Wave 3a → 3b migration notes

- Wave 3b lands Athlete.branch_id transfer — enrollments stay on the ORIGINAL branch (branch_id is denormalised + immutable). New enrollments after transfer bind to the new branch.
- Wave 4+ Finance module hooks payment_status transitions + fires EnrollmentPaymentStatusChanged from Finance side.
- Wave 4+ Attendance module reads enrollment_id via BelongsToAthleteEnrollment trait.
