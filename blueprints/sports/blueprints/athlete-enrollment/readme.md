# athlete-enrollment

Roster attachment binding an Athlete to a Team + Season. Wave 3a foundational domain module.

## 1. What this module owns

| Concern                          | Owned artefact                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enrollment record                | `AthleteEnrollment` — the roster attachment; carries tenant_id + branch_id + team_id + athlete_id + season_id + age_group_snapshot_id + team_member_id. |
| Age-group snapshot               | `age_group_snapshot_id` frozen at enrollment time. Birthday drift after registration doesn't reshape the current season's eligibility.                  |
| Consent snapshot                 | `consent_snapshot` JSONB captured at confirm-time from the athlete's consent state. Ensures compliance evidence at the point of enrollment.             |
| Payment status                   | `price_amount_cents` + `price_currency` + `payment_status` enum. Forward-compat for Wave 4 Finance integration.                                         |
| Trial conversion                 | `enrollment_type='trial_converted'` + `source_trial_id` references the originating teams::TeamTrial.                                                    |
| Atomic conversion                | On status → active, creates a `teams::TeamMember` row in the same DB transaction. Rollback on either side aborts both.                                  |
| Capacity + waitlist              | `PromoteWaitlistedEnrollmentsJob` promotes waitlist top when capacity opens. `EnrollmentWaitlisted` fires when the team is full at submit time.         |
| Provisional enrollment           | `enrollment_type='provisional'` (Enterprise-only via `athlete_enrollment_provisional` entitlement) — pending guardian consent past the deadline.        |

### 1.1 The one owned table

- `athlete_enrollments` — the roster attachment. Belongs to `Tenant` + `Branch` + `Team` + `Athlete` + `Season`. References `AgeGroup` (snapshot, SET NULL) + `TeamMember` (created on activation, SET NULL).

None carry `application_id`, `organization_id`, `region_id`, or `scope_node_id`. All cascade or are inapplicable.

## 2. Tier gating

The `athlete_enrollment.core` feature is available on every tier — every academy tracking teams needs enrollments. Tier gates apply to:

- **Small** — 15 enrollment slots per season. No waitlist. No provisional.
- **Medium** — 250 enrollment slots per season. Waitlist support.
- **Enterprise** — unlimited slots + waitlist + provisional enrollment.

Three entitlement keys:

- `athlete_enrollment_slot` (slot cap; per-season)
- `athlete_enrollment_waitlist` (boolean; Medium+ — enables the waitlist workflow)
- `athlete_enrollment_provisional` (boolean; Enterprise-only — enables the provisional state)

## 3. Enrollment state machine

```
                    submitted (fresh registration, awaiting approval or payment)
                          │
              ┌───────────┼──────────────┐
              ▼                          ▼
       payment_pending              consent_pending (skipped when not a minor, or consent already recorded)
              │                          │
              └───────────┬──────────────┘
                          ▼
                       confirmed (all preconditions met, athlete on roster from planned start date)
                          │
                          ▼
       ActivateConfirmedEnrollmentsJob (every 15min) OR admin action
                          │
                          ▼
                        active ─────────────▶ completed (season end, terminal happy path)
                          │
                          ├──(parent action or admin)──▶ withdrawn (terminal)
                          │
                          └──(disciplinary)──▶ expelled (terminal, audit-critical)
                          
       submitted / payment_pending / consent_pending ──(past registration_closes_at + config.athlete_enrollment.expiry_ttl_days)──▶ expired (terminal)
       
       submitted ──(team at capacity + waitlist enabled)──▶ waitlisted (holds a slot when others withdraw)
```

## 4. Atomic conversion to TeamMember

The load-bearing invariant: when `AthleteEnrollment.status` transitions to `active`, a `teams::TeamMember` row is created in the SAME DB TRANSACTION with `member_type='athlete'` + `member_id=enrollment.athlete_id`. Rollback on either side aborts both.

Enforced by:

1. `ConvertEnrollmentToTeamMemberAtomically` hook — invoked on status → active. Uses a DB transaction with SELECT ... FOR UPDATE on both rows.
2. `AthleteEnrollmentObserver.updating` — sets `enrollment.team_member_id` to the created TeamMember.id in the same commit.
3. `ReconcileEnrollmentTeamMemberInvariantJob` — nightly audit; every finding is a P1 signal (an active enrollment without a corresponding TeamMember OR a TeamMember without a matching enrollment).

Atomicity failures fire `EnrollmentAtomicityFailed` (P1 event). The metric `academorix.athlete_enrollment.atomicity.failures_total` should stay at 0.

## 5. Age-group snapshot semantics

`age_group_snapshot_id` is FROZEN at `EnrollmentSubmitted` time (via `SnapshotAgeGroupOnEnrollmentSubmitted` hook, which reads `athlete.current_age_group_id` at that moment). The snapshot is IMMUTABLE for the enrollment's lifetime — birthday drift or AgeGroup catalog changes don't reshape it.

The `age_group_snapshot_matches_team_age_group` rule (soft-warn only — not a hard fail) fires `EnrollmentAgeGroupSnapshotMismatched` when the snapshot doesn't match the team's declared age group. Common cases: an under-age athlete playing up (allowed), an over-age athlete playing down (typically disallowed but tenant-configurable).

## 6. Cascades

- `athlete::AthleteArchived` → `PreventEnrollmentOrphansOnAthleteArchived` refuses when active enrollments reference the athlete. cascade=true on the archive route cancels enrollments in one transaction.
- `athlete::AthleteWithdrawn` → cancels every active enrollment (transitions to withdrawn). Only when cascade=true on the athlete withdraw route.
- `athlete::AthleteGraduated` → closes every active enrollment (transitions to completed). Only when cascade=true on the athlete graduate route.
- `teams::TeamArchived` → `PreventEnrollmentOrphansOnTeamArchived` refuses when active enrollments reference the team.
- `season::SeasonArchived` → `PreventEnrollmentOrphansOnSeasonArchived` refuses when active enrollments reference the season.
- `season::SeasonCompleted` → closes every active enrollment for the season (transitions to completed).
- `tenancy::TenantErased` → cascade delete via FK.

## 7. Retention

- Active + confirmed + waitlisted enrollments: never expire.
- Completed enrollments: retained 7 years (season-history is compliance-relevant for age-eligibility audits).
- Withdrawn + expelled + expired enrollments: retained 7 years post terminal transition.
- Waitlist-only (never converted): retained 1 year for reporting, then hard-purged.

## 8. What this module does NOT do

- **Payment collection.** Deferred to Wave 4 Finance. `payment_status` is a placeholder tracking column; actual charge/refund logic lives in Finance.
- **Team roster order / lineup builder.** That's a Wave 3+ Teams feature — the enrollment establishes membership; game-day lineups are separate.
- **Sports-specific position taxonomy.** `position_preference` + `position_assigned` are free-text in Wave 3a. Wave 3+ sports registry may add a controlled list.
- **Multi-season enrollment (auto-renew).** Each season is a fresh enrollment. Wave 4+ Finance module may add auto-renewal as a subscription feature.
- **Enrollment approval workflows.** Wave 3a auto-approves any enrollment that passes the observer checks. Wave 3+ may add a manual-approval gate.
- **Refund handling.** Wave 4 Finance.

## 9. Cross-references

- `hierarchy.md` §1a — AthleteEnrollment canonical vocabulary; reject words (Signup, TeamJoin).
- `hierarchy.md` §14 — belongs-to matrix (AthleteEnrollment → Tenant + Branch + Team + Athlete + Season).
- `tenancy-columns.md` §3 + §5.
- `modules/sports/blueprints/athlete/` — the parent athlete module.
- `modules/sports/blueprints/season/` — the parent season module.
- `modules/sports/blueprints/age-group/` — the age-group catalog for snapshots.
- `modules/platform/blueprints/teams/` — the parent team module (owns TeamMember polymorphic + TeamTrial).
- `modules/platform/blueprints/staff/` — sibling style reference for multi-entity modules.

## 10. ULID prefixes owned

- `aen_` (AthleteEnrollment) — new. Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.

Consumed (referenced via FK): `ten_`, `brn_`, `tea_`, `ath_`, `sea_`, `age_`, `trm_` (TeamMember), `ttr_` (TeamTrial — source_trial_id for trial conversion), `usr_`.
