# athlete — changelog

## [Unreleased] — inception (Wave 3a)

- Athlete module authored. One owned entity:
  - `Athlete` (`ath_` prefix) — the person being coached. Optional link to User;
    belongs to Tenant + Branch.
- Plus one audit-adjacent table: `athlete_medical_history` (write-only audit
  stream, 7-year retention, outlives parent Athlete on tenant erasure).
- Three entitlement gates:
  - `athlete_slot` (slot cap: Small=15 / Medium=250 / Enterprise=unlimited;
    aligns with user_slot per hierarchy.md §7).
  - `athlete_medical_tracking` (opt-in Medium+; enables regulated_health-tier
    medical cluster).
  - `athlete_consent_workflow` (Enterprise-only; full recordable consent
    workflow with 12-month re-consent cadence).
- Athlete state machine: active ↔ paused; active → graduated (soft-terminal,
  alumni relations); active/paused → withdrawn (terminal); any → archived
  (terminal); archived → active (restore within 7-year retention).
- Load-bearing invariant: one active Athlete row per (tenant_id, user_id) when
  user_id is set. Enforced by partial unique index + AthleteObserver.
- CONFIDENTIAL cluster: emergency_contact_* + registration_notes +
  paused_reason + withdrawal_reason. Gated by `athlete.view.emergency_contact`.
  90-day post-archive redaction.
- REGULATED_HEALTH cluster: medical_conditions / medical_allergies /
  medical_medications / medical_notes. Three-layer gating (entitlement +
  permission + middleware). Dedicated `medical-audit` queue + separate audit
  table (`athlete_medical_history`) with 7-year retention.
- REGULATED_MINOR sub-tier: for athletes under `config.athlete.minor_min_age`
  (default 16), first_name + last_name STRIPPED from cross-tenant platform-admin
  reads. Photos never render on public-facing surfaces regardless of consent.
  Communications route through guardian channels only.
- Consent snapshot: `consent_photo_release` / `consent_medical_disclosure` /
  `consent_third_party` + `consent_recorded_at` + `consent_recorded_by_user_id`.
  Wave 3a: soft-warn on consent by non-authorised recorder for minors; Wave 3b:
  hard-fail once AthleteGuardian sibling module lands.
- Age-group snapshot: nightly `RollAthleteAgeGroupSnapshotJob` recomputes
  `current_age_group_id` + fires `AthleteAgeGroupSnapshotUpdated` on flips
  (birthday drift + AgeGroup catalog changes).
- Minor turned adult: `CheckAthleteMinorTurnedAdultJob` fires
  `AthleteMinorTurnedAdult` on the 18th birthday + drives the re-consent flow.
- Cascade paths: `BranchArchived` → PreventAthleteOrphansOnBranchArchived;
  `UserSoftDeleted` → PreventUserArchiveWithActiveAthlete (also blocks when user
  is minor's consent recorder); `AthleteArchived/Graduated/Withdrawn` cascades
  to enrollment (Wave 3a sibling); `TenantErased` →
  PurgeAthleteDataForErasedTenant (medical_history migrates to compliance
  archive); `AgeGroupBoundsChanged` / `AgeGroupCutoffChanged` →
  MaybeRecomputeAthleteAgeGroupSnapshots.
- Retention: emergency_contact_* + medical_* redacted 90 days post-archive;
  demographic metadata retained 7 years; hard-purge only when no downstream
  references.
- Eight notification categories (welcome / consent-recorded / consent-expiring /
  age-group-changed / minor-turned-adult / paused / graduated / withdrawn).
- Realtime broadcasts: `tenant.{id}.athletes`, `branch.{id}.athletes`,
  `user.{id}.athletes`. Medical events NEVER broadcast. Minor names stripped on
  all channels.
- SDUI: 3 athlete screens (list / create / edit / medical-detail) + 4 widgets
  (age-group-badge / consent-summary / athlete-picker / minor-badge).
- Five scheduled jobs (RollAthleteAgeGroupSnapshot / CheckMinorTurnedAdult /
  ReconcileConsents / PurgeArchived / AutoLinkUser) running daily 02:00-05:00
  UTC + hourly for auto-link.
- 18 published events. One attribute contract (AsAthleteListener).

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`,
  `branch`, `entitlements`, `age-group`.
- Depends on `notifications` transitively — declared as `planned_consumers`
  because notifications module wires the actual delivery.
- Extended by NONE. Wave 3a siblings (athlete-guardian + athlete-enrollment)
  reference Athlete but the coupling is loose — Athlete does not depend on them.
- Planned consumers: athlete-guardian, athlete-enrollment, event, session,
  teams, finance, notifications, attendance, safeguarding, communications.
- Wave 3a inception release.

### Design notes

- Athlete does NOT carry `application_id` / `organization_id` / `region_id` /
  `scope_node_id`. All cascade or are inapplicable. Enforced by
  tenancy-compliance-auditor per tenancy-columns.md §5.
- Athlete.branch_id is IMMUTABLE in Wave 3a. Wave 3b ships the transfer flow
  with `athlete_branches` multi-branch pivot + AthleteBranchChanged event.
- Athlete.user_id is IMMUTABLE POST-FIRST-LINK. Cannot repoint at a different
  User — audit-trail launder.
- Athlete.date_of_birth is IMMUTABLE POST-CREATE. DOB is
  age-group-eligibility-critical. Typo fixes require archive + recreate in Wave
  3a; Wave 3+ introduces a super_admin DOB-override event.
- Athlete.current_age_group_id is a SNAPSHOT (nightly-recomputed). Enrollment
  forms use AgeGroupResolver::resolveFor(athlete) for authoritative computation.
  Snapshot exists for indexed filtering.
- The `guardian` role is INTRODUCED by this module (via the rbac RoleDefinition
  catalogue). Consumers that need guardian-flavoured permissions reference this
  role. Guardians get `.own` scoped read + limited write permissions on their
  assigned athletes.
- Medical writes DO NOT feed the activity feed. Coaches shouldn't accidentally
  see 'X updated Y's allergies' scrolling past — the AthleteMedicalUpdated event
  routes to the medical-audit queue exclusively.
- Photo consent + third-party consent + medical consent are SEPARATE FLAGS.
  Granular consent aligns with GDPR Art. 7 principle of purpose-specific
  consent.
- Minor names + photos protected as regulated_minor sub-tier. Aligns with COPPA
  (US) + GDPR Art. 8 (EU).

### ULID prefix registration

- `ath_` (Athlete) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` in the same
  commit as the schema landing. Falls in the 3-char lowercase pattern per the
  constraints in that registry.

### Wave 3a → 3b migration notes

- When AthleteGuardian sibling module lands, the
  `consent_recorded_by_authorised_guardian` rule flips from soft-warn to
  hard-fail (config `athlete.consent.enforce_guardian_authorisation` = true).
- The `athletes.viewAny.own` + `athletes.view.own` +
  `athletes.view.medical.own` + `athletes.view.emergency_contact.own` +
  `athletes.manage.consents.own` + `athletes.manage.emergency_contact.own` +
  `athletes.withdraw.own` permissions become fully functional once
  AthleteGuardian rows exist (the `.own` scope for guardians resolves against
  those rows).
- `athlete_branches` multi-branch pivot introduced Wave 3b. `Athlete.branch_id`
  becomes the "home" branch; operational assignments to additional branches land
  in the pivot.
