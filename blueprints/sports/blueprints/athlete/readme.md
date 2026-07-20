# athlete

The person being coached. Wave 3a foundational domain module.

## 1. What this module owns

| Concern                       | Owned artefact                                                                                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The person being coached      | `Athlete` — snapshot demographic + medical + emergency contact profile. Optional link to `User`.                                                                                                                  |
| Consent snapshot              | `consent_photo_release` / `consent_medical_disclosure` / `consent_third_party` + `consent_recorded_at` + `consent_recorded_by_user_id`.                                                                           |
| Medical cluster               | `medical_conditions` / `medical_allergies` / `medical_medications` / `medical_notes`. REGULATED_HEALTH-tier. 7-year retention. 90-day post-archive redaction.                                                     |
| Emergency contact cluster     | `emergency_contact_name` / `emergency_contact_phone` / `emergency_contact_relationship`. CONFIDENTIAL-tier. Same 7-year / 90-day retention.                                                                       |
| Age-group snapshot            | `current_age_group_id` + `current_age_group_snapshot_at`, recomputed nightly by `RollAthleteAgeGroupSnapshotJob`.                                                                                                 |
| Lifecycle                     | active → paused (safeguarding hold OR administrative pause) → active OR active → graduated (soft-terminal — alumni) OR withdrawn (parent-initiated exit) OR archived (admin hard-terminal).                       |
| Minor turned adult transition | Nightly `CheckAthleteMinorTurnedAdultJob` fires `AthleteMinorTurnedAdult` on the 18th birthday for HR + guardian audit. Consent snapshot rolls forward — new consents required from the adult athlete themselves. |
| athlete_slot entitlement      | Small=15 / Medium=250 / Enterprise=unlimited. Consumed on create; released on archive/hard-delete.                                                                                                                |

### 1.1 The one owned table

- `athletes` — the person being coached. Belongs to `Tenant` + `Branch`.
  Optionally references `User` (null for most minors — they have no login).

Plus one audit-adjacent table:

- `athlete_medical_history` — write-only audit stream for every medical-field
  mutation. 7-year retention independent of the parent Athlete row (migrates to
  compliance archive on tenant erasure, same pattern as
  `staff_compensation_history`).

None carry `application_id`, `organization_id`, `region_id`, or `scope_node_id`
— all cascade or are inapplicable. Enforced by the tenancy-compliance-auditor +
observer refusal chains.

## 2. Tier gating

The `athlete` feature is available on every tier — every academy needs athletes.
Tier gates apply to CAPACITY + safeguarding features.

- **Small** — 15 athlete slots. No medical tracking (opt-in Enterprise). No
  consent workflow (implicit consent at signup).
- **Medium** — 250 athlete slots. Medical tracking on (with
  `athlete.view.medical` permission). Consent workflow on.
- **Enterprise** — unlimited athletes. Full medical tracking + consent
  workflow + safeguarding hold flag.

Three entitlement keys:

- `athlete_slot` (slot cap; matches user_slot per hierarchy.md §7)
- `athlete_medical_tracking` (boolean; Medium+ — opt-in on Small)
- `athlete_consent_workflow` (boolean; Enterprise-only — the full recordable
  workflow with expiry + revocation)

## 3. Athlete lifecycle

```
                    (admin creates)
                          │
                          ▼
                       active ─────(admin action)─────▶ paused ─────(admin action)─────▶ active
                          │                              │
                          │                              └──(90-day safeguarding hold  ──▶ archived
                          │                                  auto-expiry OR admin action)
                          │
                          ├──(admin action)──▶ graduated (soft-terminal — alumni relations, historical reference)
                          │
                          ├──(parent action  ──▶ withdrawn (terminal)
                          │   OR admin)
                          │
                          └──(admin action)──▶ archived (terminal)
                                                    │
                                                    └──(retention purge past 7 years)
                                                        │
                                                        ▼
                                                    hard-deleted
```

Terminal states: `graduated` (soft — retained for alumni), `withdrawn` (terminal
on athlete's side; keeps historical enrollments for audit), `archived` (terminal
admin decision).

**Every non-archived state consumes ONE unit of athlete_slot.** Slot released on
transition to `archived` OR on hard-delete of a `graduated` / `withdrawn` row.

## 4. The medical cluster — private-tier handling

Medical data is regulated_health-tier. The module handles it with THREE layers
of gating:

1. **Entitlement** — `athlete_medical_tracking` must be ON. Off (Small default)
   = the medical columns MUST be NULL; observer refuses writes.
2. **Permission** — `athlete.manage.medical` for writes; `athlete.view.medical`
   for reads. Distinct from `athlete.update` / `athlete.view`. The redactor
   strips medical fields from egress when the caller lacks
   `athlete.view.medical`.
3. **Middleware** — `athlete.enforce_medical_permission` refuses
   `/athletes/{athlete}/medical` (GET + PATCH) at the route boundary. The
   sub-resource is entirely permission-gated so unpermissioned callers never see
   the DB.

Medical writes dispatch on a SEPARATE `medical-audit` queue and write to a
SEPARATE `athlete_medical_history` table (not the normal `audits` table) with
7-year regulated-health retention. Never surface in activity, analytics amounts,
or realtime broadcasts.

Values NEVER surface in the activity feed, NEVER carry through to analytics
events (only fact-of-change + category), NEVER broadcast on any realtime
channel.

## 5. Emergency contact cluster — confidential-tier

Same three-layer gating pattern as medical but with
`athlete.view.emergency_contact` / `athlete.manage.emergency_contact`
permissions + the `athlete.enforce_emergency_contact_permission` middleware.
Retention: same 7-year + 90-day post-archive redaction pattern.

## 6. Consent snapshot — GDPR Art. 8 + safeguarding compliance

The Athlete row carries a three-flag consent snapshot:

- `consent_photo_release` — permission to use in tenant marketing / social /
  gallery.
- `consent_medical_disclosure` — permission for coaches (not just HR) to read
  the medical cluster.
- `consent_third_party` — permission to share with insurance, subprocessors,
  external referees.

Plus provenance:

- `consent_recorded_at` — when the consents were last confirmed.
- `consent_recorded_by_user_id` — the User who recorded (typically the athlete's
  primary AthleteGuardian for minors, or the athlete themselves post-adulthood).

The `athlete.consent_workflow` entitlement (Enterprise) adds a full workflow —
recordable events (`AthleteConsentRecorded` / `AthleteConsentRevoked`), 12-month
re-consent reminder cadence, and per-purpose retention log.

For minors, GDPR Art. 8 requires parental consent. The observer enforces: for
athletes under `athlete.minor_min_age` (default 16), consent MUST be recorded by
a User with an active AthleteGuardian row + `has_legal_custody=true` (enforced
via cross-module `consent_recorded_by_authorised_guardian` rule; skipped in Wave
3a until the guardian module lands + hooked up in the same commit).

## 7. Cascades

The module ships several cascades:

- `BranchArchived` → `PreventAthleteOrphansOnBranchArchived` refuses when active
  athletes reference the branch.
- `UserSoftDeleted` → `PreventUserArchiveWithActiveAthlete` refuses when the
  User is `consent_recorded_by_user_id` for any active minor athlete (guardian
  handoff required first) OR when the User has an active linked Athlete row.
- `TenantErased` → cascade delete via FK; `athlete_medical_history` migrates to
  compliance archive.
- `AgeGroupBoundsChanged` / `AgeGroupCutoffChanged` →
  `MaybeRecomputeAthleteAgeGroupSnapshots` recomputes affected athletes in-band
  (small tenants — bounded work) or defers to the next nightly job (Enterprise —
  batched).

## 8. Retention

- Active + paused athletes: never expire.
- Graduated athletes: retained indefinitely for alumni relations (no automatic
  purge) unless the tenant explicitly opts into
  `athlete.retention.graduate_purge_after_years` (default off).
- Withdrawn / archived athletes:
  - 90-day PII grace: emergency_contact_* + medical_* fields redacted to
    `[REDACTED]`.
  - 7-year employment/medical record retention on the rest of the row.
  - Hard-purge only when no downstream references (Enrollment, TeamMember,
    etc.).
- `athlete_medical_history`: 7 years from row creation. Outlives parent Athlete.
  Migrates to compliance archive on tenant erasure.

## 9. What this module does NOT do

- **Multi-branch pivot for athletes.** Athlete belongs to one home branch in
  Wave 3a. Multi-branch athletes (a swimmer training at two of a tenant's pool
  locations) require the Wave 3b `athlete_branches` pivot.
- **Branch transfer.** `Athlete.branch_id` is IMMUTABLE post-create in Wave 3a.
  Wave 3b ships the transfer flow + `AthleteBranchChanged` event.
- **Cross-tenant athlete transfer.** Archive + re-create at destination — never
  a "move".
- **Automatic guardian creation on Athlete create.** The AthleteGuardian module
  (sibling) handles that flow — the Athlete module reserves the FK direction
  (Guardian → Athlete via athlete_id) but does not auto-provision a guardian
  row.
- **Provisional / trial athletes.** Not a shape here. Trial signups land as
  TeamTrial rows (teams module), and only convert to Athlete + AthleteEnrollment
  on decision.
- **Athlete-to-athlete communications / social features.** Deferred to Wave 5+
  Communications module.
- **Performance metrics / test results / progress reports.** Deferred to Wave 4+
  Performance module — these bind by athlete_id via the `BelongsToAthlete` trait
  shipped here.
- **Photo / avatar upload.** Deferred to Wave 4+ Storage module — the
  `profile_photo_url` column is a bare string; upload flow lives elsewhere.
- **Sport-specific medical clearance workflow.** Deferred to Wave 4+
  Safeguarding module. The medical cluster here is snapshot data; workflow
  (clearance status, sign-off, expiry) is a follow-up.

## 10. Cross-references

- `hierarchy.md` §1a — Athlete canonical vocabulary; reject words (Learner,
  Trainee, Student).
- `hierarchy.md` §14 — belongs-to matrix (Athlete → Tenant + Branch;
  optionally + User).
- `hierarchy.md` §16 — decision ladder for adding new domain models.
- `hierarchy.md` §7 — tier matrix (athlete_slot
  Small=15/Medium=250/Enterprise=null).
- `hierarchy.md` §17 Q — "Why isn't Athlete a User?" — children often lack
  accounts.
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`. Athlete carries
  `branch_id` + optional `user_id`. Medical history carries `tenant_id` +
  `athlete_id`.
- `tenancy-columns.md` §5 — forbidden columns (never `application_id`,
  `organization_id`, `region_id`, `scope_node_id` on athletes).
- `modules/platform/blueprints/branch/` — the parent branch module (branch
  archive prevention hook).
- `modules/platform/blueprints/staff/` — the sibling 1-entity-with-satellite
  module. Same shape of policy/observer/event/cluster conventions.
- `modules/sports/blueprints/age-group/` — the age-group catalog.
  Athlete.current_age_group_id resolves against this.
- `modules/sports/blueprints/athlete-guardian/` — the sibling module binding
  Athletes to responsible Users.
- `modules/sports/blueprints/athlete-enrollment/` — the sibling module attaching
  Athletes to Teams + Seasons.

## 11. ULID prefixes owned

- `ath_` (Athlete) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json` at merge time.

Consumed (referenced via FK): `ten_`, `brn_`, `usr_`, `age_`.
