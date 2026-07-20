# coaching

The Coach lane. Wave 3b sports-domain module. Answers: **which Staff members are
coaches, what are they qualified to coach, and which Sessions/Teams are they
assigned to?**

## 1. What this module owns

| Concern                   | Owned artefact                                                                                                                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coaching profile          | `CoachingProfile` (`cop_`) — per-Staff satellite. One Staff has zero or one CoachingProfile. Presence marks that Staff as an active Coach.                                   |
| Assignment                | `CoachAssignment` (`cas_`) — polymorphic pivot Coach ↔ Session / Team / Event with role (head_coach / assistant_coach / observer / substitute), bounded by start + end date. |
| Certification             | `CoachCertification` (`ccf_`) — Coach's held credential (issuing body + name + level + issued_at + expires_at). Drives 90/30/7-day expiration cadence.                       |
| Skill rating              | `CoachSkillRating` (`csr_`) — per-Coach per-Sport/Discipline/Position rating (1-5 stars OR level enum). Feeds athlete↔coach match-making.                                    |
| Verification workflow     | Admin-run verifier that promotes a fresh CoachingProfile to `verified_by_admin_at != null`. Coach must be verified before an assignment can be created.                      |
| Assignment conflict guard | `AssignmentConflictDetector` refuses a second `head_coach` assignment for the same Session/Team; assistants may stack.                                                       |
| Expiration schedule       | On CoachCertificationAdded, schedules three notification checkpoints (90 / 30 / 7 days pre-`expires_at`) + one at-expiration event.                                          |

### 1.1 The four owned tables

- `coaching_profiles` — one per Staff (partial-unique on
  `(tenant_id, staff_id) WHERE deleted_at IS NULL`).
- `coach_assignments` — polymorphic on `(assignable_type, assignable_id)`;
  unique-active guard on the same-role pivot.
- `coach_certifications` — issued/expires ledger; expiration-index on
  `(tenant_id, expires_at)` for the nightly sweep.
- `coach_skill_ratings` — polymorphic on `(ratable_type, ratable_id)`; unique
  row per (coach, ratable).

Every row carries `tenant_id` (CASCADE) per `tenancy-columns.md` §3. **No** row
carries `application_id`, `region_id`, `organization_id`, `branch_id`, or
`scope_node_id` — enforced by the tenancy-compliance-auditor + observer refusal
chains. Branch cascades through `coaching_profile.branch_id`; organization /
region / application cascade further through Branch → Tenant.

## 2. Coach IS Staff — the composition rule

`Coach` is not its own root aggregate. A Coach is a Staff row that ALSO has a
live `CoachingProfile`. Same `stf_` identifier flows across every downstream
reference. Consequences:

- Coach's login lives on `staff.user_id` → `users.id`. This module owns no auth
  surface.
- Employment metadata (hire date, employment_type, wage) lives on Staff, not
  CoachingProfile.
- Deactivating a CoachingProfile does NOT terminate the Staff — the person keeps
  their non-coach job (a coach demoted to reception is a Staff row with no
  active CoachingProfile).
- Offboarding a Staff cascades: `DeactivateCoachingProfileOnStaffOffboarded`
  flips the CoachingProfile inactive + cancels every open assignment.

`hierarchy.md` §1b vocabulary: **Coach** = "a Staff row acting as a coach with a
sport-specific profile". Never write `Trainer`, `Instructor`, or `CoachRecord` —
those are rejected in review.

## 3. Tier gating

The `coaching.core` feature is available on every tier — every academy hiring
coaches needs coaching-profile tracking. Tier gates apply to:

- **Small** — 10 active CoachingProfiles; certifications tracked as simple text
  list; no skill ratings; assignments limited to Session + Team (no Event).
- **Medium** — 100 active CoachingProfiles; full certification workflow
  (verification + document upload); skill ratings enabled; multi-branch
  assignments; public directory opt-in.
- **Enterprise** — unlimited CoachingProfiles; extended retention (7 → 10
  years); customer-facing coach picker at booking time.

Entitlement keys (see `entitlements.json`):

- `coaching_capture` (boolean; master feature — Small+)
- `coaching_profile_slot` (integer; Small=10 / Medium=100 / Enterprise=null)
- `coaching_advanced_certifications` (boolean; Medium+ — enables verification
  workflow beyond a text list)
- `coaching_skill_ratings` (boolean; Medium+ — enables the rating system)
- `coaching_multi_branch` (boolean; Medium+ — assignments outside the coach's
  `branch_id`)
- `coaching_public_directory` (boolean; Medium+ — expose verified coaches on the
  customer-facing site)
- `coaching_extended_retention` (boolean; Enterprise-only — 7y → 10y for cert
  compliance)

## 4. CoachingProfile lifecycle

```
          (admin captures)
                │
                ▼
          created (is_active=true, verified_by_admin_at=null)
                │
                ▼
     admin invokes /verify  ──▶  verified (is_active=true, verified_by_admin_at != null)
                │                    │
                │                    │  admin invokes /deactivate  ──▶ deactivated
                │                                                        │
                │                                                        │  admin invokes /reactivate
                │                                                        ▼
                │                                                     re-verified
                │
                └──(Staff offboarded — via DeactivateCoachingProfileOnStaffOffboarded)──▶ deactivated (auto)
```

Load-bearing invariants:

1. **One profile per Staff.** Enforced by partial-unique
   `(tenant_id, staff_id) WHERE deleted_at IS NULL`. Same person cannot be
   double-carded.
2. **No assignment without a verified + active profile.** Enforced by
   `CoachAssignmentObserver.creating` — refuses when
   `coachingProfile.is_active=false` OR `verified_by_admin_at=null`.
3. **Head-coach uniqueness per assignable.** Partial-unique on
   `(tenant_id, assignable_type, assignable_id, role='head_coach') WHERE deleted_at IS NULL AND (end_date IS NULL OR end_date > NOW())`.

## 5. Certification workflow

Certifications are a two-step ledger — capture then verify. The nightly
`NotifyCertificationExpiringJob` sweeps `expires_at` in three cadences.

```
      (coach OR admin captures)
                │
                ▼
        added (verified_by_admin_user_id=null)   ──── scheduled: -90d, -30d, -7d, -0d
                │
                ▼
    admin verifies (verified_at != null, verified_by_admin_user_id set)
                │
                ├─ 90 days pre-expiry → CoachCertificationExpiringSoon
                ├─ 30 days pre-expiry → CoachCertificationExpiringSoon (elevated)
                ├─  7 days pre-expiry → CoachCertificationExpiringSoon (urgent)
                └─  0 days (expired)  → CoachCertificationExpired (coach + admin — action required)
```

- `verification_notes` + `verification_url` are optional. `document_url` MUST be
  HTTPS S3 when set (SDUI uploader signs via storage::File in Wave 4).
- Duplicate captures refused: partial-unique on
  `(tenant_id, coaching_profile_id, issuing_body, certification_name, issued_at)`.
- Expired certifications are NOT auto-deleted — they remain on the row for
  compliance audit (7-year retention; 10-year on `coaching_extended_retention`).
- Certifications with an expected `verification_url` at a recognized
  `issuing_body` may be verified asynchronously via `CoachingProfileVerifier`
  binding (Wave 4+ webhooks — USSF / NASM / Red Cross public APIs where
  available).

## 6. Assignment semantics

Every `CoachAssignment` is
`(coaching_profile_id) × (assignable_type, assignable_id) × role`. Polymorphic
on the assignable side — Session (`ses_*`), Team (`tea_*`), Event (`evt_*`).

- **head_coach** — exactly one per assignable at a time. Enforced by
  partial-unique + observer.
- **assistant_coach** — multiple allowed. No cap at the schema layer; per-tenant
  `coaching.assignment.max_assistants_per_assignable` bounds via
  `AssignmentConflictDetector`.
- **observer** — non-participating; used for evaluators / auditors /
  student-coaches shadowing.
- **substitute** — activated only when the head or an assistant misses a
  session; the assignment carries an `activated_at` timestamp when the
  substitute steps in.

The `NotifyCoachAvailabilityConflictJob` runs pre-create-and-nightly. It
cross-checks the coach's `availability_json` against the assignable's declared
time window and fires a soft warning event (`CoachAssignmentConflictDetected`) —
the assignment is NOT refused; it lands with the conflict metadata so the admin
can override with intent.

## 7. Skill rating system

Admins rate coaches on the sports/disciplines/positions they claim to master.
Two scales:

- `stars_1_5` — freeform 1-5.
- `level_5_stage` — beginner (1) / intermediate (2) / advanced (3) / expert (4)
  / master (5).

Rules:

- **No self-rating.** The `CoachSkillRatingObserver.creating` refuses when
  `rated_by_user_id` resolves to the same Staff.user_id as the rated coach.
- **Polymorphic ratable.** `(ratable_type, ratable_id)` points at a Sport /
  Discipline / Position from `sports/registry`. The
  `valid_ratable_type_for_rating` rule validates the row is `is_active=true` in
  the registry.
- **Expiry.** `expires_at` defaults to 2 years post-`rated_at`
  (`coaching.rating.default_expiry_years`). `PurgeExpiredSkillRatingsJob` sweeps
  nightly.
- **Per-coach per-ratable uniqueness.** Partial-unique on
  `(tenant_id, coaching_profile_id, ratable_type, ratable_id) WHERE deleted_at IS NULL`.
  Updates replace; re-rating a coach on the same sport rewrites the row
  (audit-tracked).

Feed use: athlete↔coach match-making (Wave 4 attendance/scheduling) reads
`coachingProfile.skillRatings->filter(rating->ratable == athlete.primary_sport)->max()`.

## 8. Cascades

- `staff::StaffOffboarded` → `DeactivateCoachingProfileOnStaffOffboarded` flips
  the profile inactive + fires `CoachingProfileDeactivated` + cascades to
  `CancelActiveAssignmentsOnCoachingProfileDeactivated`.
- `staff::StaffPutOnLeave` → observer soft-flags the profile with
  `on_leave=true` metadata (assignments remain but new assignments refused).
- `sports/session::SessionCancelled` → related assignments are NOT deleted; they
  retain the historical roster (session-attribution is preserved for retention).
  New sessions may reuse the coach.
- `sports/session::SessionRescheduled` → assignments untouched; the
  availability-conflict job re-runs against the new window.
- `sports/team::TeamArchived` → soft-cancel every open assignment on that team
  (fires `CoachAssignmentCancelled`).
- `sports/event::EventArchived` → soft-cancel every open assignment on that
  event.
- `tenancy::TenantErased` → cascade delete via FK.

Certification + skill-rating cascades never delete the underlying row when the
parent CoachingProfile deactivates — the audit trail survives. Only tenant
erasure (or explicit hard-purge past retention) removes them.

## 9. Retention

- CoachingProfile: 7 years post-deactivation (US Dept of Labor + IHSA
  compliance); 10y with `coaching_extended_retention` (Enterprise).
- CoachAssignment: 7 years post-`end_date`.
- CoachCertification: retained WHILE ACTIVE + 7 years post-expiration.
- CoachSkillRating: 2 years default (per
  `coaching.rating.default_expiry_years`); 5 years with
  `coaching_extended_retention`.
- TenantErased: cascade delete via FK EXCEPT records under an active regulator
  hold (defense-in-depth check in `PurgeCoachingDataForErasedTenant`).

## 10. What this module does NOT do

- **Coach payroll or W-2 / 1099 tax generation.** `hourly_rate_cents` is a
  reference field for scheduling + planning only. Payroll is out-of-scope;
  downstream finance modules read the field but never write it back.
- **Background check integration.** SafeSport, NCAA-clearance, criminal-record
  checks all belong in a separate `safesport` module (planned Wave 5+). This
  module ships the certification-workflow scaffolding but does NOT integrate
  with third-party verification APIs.
- **Coach-to-athlete direct messaging.** That's the notifications module's
  concern.
- **Coach performance analytics beyond skill ratings.** Growth-plane analytics
  reads the rating events but this module doesn't emit derived metrics
  (session-attendance-per-coach, retention-per-coach, etc.).
- **Customer-facing coach reviews / testimonials.** V1 has no review surface.
  Star ratings here are ADMIN-authored, not customer-authored.
- **Coach commission tracking.** Finance module concern.
- **AthleteCoach preference or "favorite coach" flag on athletes.** Deferred —
  Wave 4+ attendance module may add.
- **Multi-tenant coach records.** A coach who works for two tenants is two
  separate `CoachingProfile` rows against two separate `Staff` rows against two
  separate `User` rows on two separate `identities` (per the Identity split in
  `hierarchy.md` §3).

## 11. Cross-references

- `hierarchy.md` §1b — Coach canonical vocabulary; rejected words (Trainer,
  Instructor).
- `hierarchy.md` §14 — belongs-to matrix (Coach → Tenant + Branch + Staff).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns (never `application_id`,
  `region_id`, `organization_id`, `scope_node_id` on any owned row).
- `modules/platform/blueprints/staff/` — parent module.
  `CoachingProfile.staff_id` RESTRICT.
- `modules/sports/blueprints/session/` — Session references `head_coach_id` on
  the session row for the primary coach; this module owns the many-to-many via
  `CoachAssignment` for stacking assistants.
- `modules/sports/blueprints/registry/` — Sport / Discipline / Position catalog.
  Skill ratings + primary_sport reference these tables via string-slug lookup,
  not FK.
- `modules/sports/blueprints/athlete-guardian/` — sibling satellite-to-parent
  style reference.
- `modules/sports/blueprints/athlete-enrollment/` — sibling polymorphic-pivot
  style reference.

## 12. ULID prefixes owned

- `cop_` (CoachingProfile) — new. Register in
  `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
- `cas_` (CoachAssignment) — new.
- `ccf_` (CoachCertification) — new.
- `csr_` (CoachSkillRating) — new.

Coach itself carries NO new prefix — Coach IS Staff (`stf_`).

Consumed (referenced via FK): `ten_`, `stf_`, `brn_`, `usr_`, `ses_`, `tea_`,
`evt_`, `spt_`, `dsc_`, `pos_`, `fil_` (verification / signed photo document,
Wave 4+).
