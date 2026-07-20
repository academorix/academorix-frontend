# staff — changelog

## [Unreleased] — inception (Wave 2b)

- Staff module authored. Two owned entities:
  - `Staff` (`stf_` prefix) — employment record wrapping a User row with
    employment metadata.
  - `Coach` (`coa_` prefix) — Staff-satellite adding per-sport coaching profile.
- Plus one audit-adjacent table: `staff_compensation_history` (write-only audit
  stream, 7-year retention, outlives parent Staff).
- Six entitlement gates:
  - `staff_slot` (slot cap: Small=5 / Medium=50 / Enterprise=unlimited).
  - `coach_slot` (slot cap: Small=1 / Medium=10 / Enterprise=unlimited).
  - `staff_compensation_tracking` (opt-in boolean; off by default on every tier
    — HR explicitly enables).
  - `staff_org_chart` (Enterprise-only; enables reports_to_staff_id + org-chart
    visualisation).
  - `coach_certifications_verified` (Enterprise-only; HR-verified certification
    workflow).
  - `coach_rating_display` (Medium+; public rating badge on tenant's coach
    directory).
- Employment state machine: pre_hire → active → on_leave / suspended /
  offboarding → offboarded, plus rehire path.
- Coach state machine: active → paused → archived. Decoupled from Staff but
  cascades on Staff leave / suspend / offboard.
- Load-bearing invariant: exactly one active `is_branch_manager=true` Staff per
  branch. Enforced by partial unique index + StaffObserver +
  ReconcileBranchManagerInvariantJob (nightly audit).
  `academorix.staff.branch_manager.invariant_violations` counter must stay at 0.
- Cascade paths: `BranchArchived` → PreventStaffOrphansOnBranchArchived;
  `UserSoftDeleted` → PreventUserArchiveWithActiveStaff; `StaffOffboarded`
  cascades to Coach + unblocks User archive; `TenantErased` →
  PurgeStaffDataForErasedTenant (compensation_history migrates to compliance
  archive).
- Compensation is private-tier: three-layer gating (entitlement + permission +
  delta-cap). Compensation events dispatch on dedicated `compensation-audit`
  queue; write to separate `staff_compensation_history` audit table. Never
  surfaces on activity feed, analytics (except fact-of-change), or realtime
  broadcasts.
- Coach certifications: JSONB array with structural validation (organization +
  certification + certified_at required; expires_at > certified_at when set).
  Enterprise `coach_certifications_verified` gate promotes new entries to
  pending_verification state pending HR sign-off.
- Coach rating: nightly aggregation from Wave 3+ session ratings via
  AggregateCoachRatingsJob. Wave 2b ships as no-op placeholder (SessionRating
  table lands Wave 3+). Manual writes to Coach.rating are refused by the
  observer.
- Retention: emergency_contact_* + tax_id_last4 redacted 90 days
  post-offboarding; employment metadata retained 7 years; hard-purge only when
  no downstream references.
- Nine notification categories (welcome / offboarding-scheduled / offboarded /
  promoted-to-manager / cert-expiring / probation-ending / compensation-changed
  / coach-on-leave / suspended).
- Realtime broadcasts: `tenant.{id}.staff`, `branch.{id}.staff`,
  `user.{id}.staff`. Compensation NEVER broadcasts.
- SDUI: 6 staff screens (list / hire / edit / compensation / org-chart /
  offboard) + 4 coach screens (list / create / certifications / availability) +
  5 widgets (staff-picker / coach-picker / coach-rating / certification-badge /
  employment-status-chip).
- Five scheduled jobs (CheckProbationEndingSoon / ExpireCoachCertifications /
  ReconcileBranchManagerInvariant / PurgeOffboardedStaff /
  AggregateCoachRatings) running daily 02:00-06:00 UTC.
- 26 published events. Two attribute contracts (AsStaffListener +
  AsCoachListener).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `user`, `entitlements`.
- Depends on `notifications` transitively (notification dispatch) — declared as
  `planned_consumers` because notifications module wires the actual delivery.
- Extended by NONE. Teams (Wave 3) references Staff + Coach via polymorphic
  TeamMember pivot but the reference is loose — not a hard dependency.
- Planned consumers: teams (Wave 3), sports (Wave 3), finance (Wave 4 payroll),
  attendance (Wave 4), coaching (Wave 3+), scheduling (Wave 4).
- Wave 2b inception release.

### Design notes

- Staff does NOT carry `application_id` / `organization_id` / `region_id` /
  `scope_node_id`. All cascade or are inapplicable. Enforced by
  tenancy-compliance-auditor per tenancy-columns.md §5.
- Coach cascades EVERYTHING through staff → branch. `coach.branch_id`,
  `coach.organization_id`, `coach.region_id`, `coach.user_id` DO NOT EXIST.
- Staff.branch_id is IMMUTABLE in Wave 2b. Branch transfer flow lands Wave 3+.
- Staff.user_id is IMMUTABLE post-create. Never repoint a Staff at a different
  User — that's a compliance smell (audit-trail launder).
- Coach.staff_id is IMMUTABLE post-create. A Staff's coaching career belongs to
  one Coach row.
- The primary invariant of the module is Staff-can't-outlive-its-User via
  RESTRICT on user_id — enforced at DB level + defense-in-depth via the
  PreventUserArchiveWithActiveStaff hook.
- The BRANCH-MANAGER invariant is the second — partial unique index enforces one
  manager per branch at DB level, reconciler catches drift.
- Compensation is fully separated from the normal audit stream: dedicated queue
  (compensation-audit), dedicated audit table (staff_compensation_history),
  dedicated retention (7 years, outlives Staff). Never in activity, never in
  analytics amounts, never in broadcasts.
- Emergency contact + tax_id_last4 are confidential-tier with 90-day
  post-offboarding redaction. Aligns with GDPR Art. 5(1)(c) minimisation.
- Anti-discrimination: every StaffSuspended + StaffOffboarded event carries
  termination_reason. Payload NEVER exposed to tenant analytics dashboards;
  retained in audits + fed into platform-side compliance dashboard for
  regulator-facing pattern detection.
- The `hr` role is INTRODUCED by this module (via the rbac RoleDefinition
  catalogue reference in permissions.json). Every consumer that needs
  HR-flavoured permissions references this role. HR does NOT get `staff.hire` /
  `staff.suspend` by default — those stay owner/admin-only unless the tenant
  explicitly extends the hr role.
- Wave 2 ships `Coach.rating` write path as a no-op — the
  AggregateCoachRatingsJob runs but the SessionRating query returns zero rows
  until Wave 3+.
- Wave 2 ships `Coach.sport_key` as free-text with a soft validation warning;
  Wave 3+ hardens to a controlled sport registry.

### ULID prefix registration

- `stf_` (Staff) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` in the same
  commit as the schema landing.
- `coa_` (Coach) — new. Register in the same commit. Both should land as
  `promoted_from_reserved: true` if we pre-reserve them, otherwise as fresh
  entries. Both fall in the 3-4-char lowercase pattern per the constraints in
  that registry.
