# teams

Group of humans practicing / playing / attending under a Branch. Sport-agnostic — a gym runs its classes as Teams, a school runs its cohorts as Teams, an academy runs its squads as Teams. Wave 2 infrastructure.

## 1. What this module owns

| Concern                          | Owned artefact                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Team catalogue                   | `Team` (squads, classes, cohorts, groups, crews) — always attached to Branch.                           |
| Polymorphic roster               | `TeamMember` — one row per (team, person). `member_type` + `member_id` point at Athlete / Coach / Staff / User. |
| Trial workflow                   | `TeamTrial` — probationary tryouts. Convertible atomically to a `TeamMember` row.                       |
| Event participation              | `EventTeam` — a Team's registration + attendance + result for a Wave 3 Event.                           |
| Schedule pattern                 | JSONB `schedule_pattern` on the Team row (recurring weekly practice slots — visualisation-only pre-Wave-3). |
| Capacity + waitlist              | `capacity` + `capacity_waitlist` on the Team row (nullable = no cap).                                   |
| Age + gender eligibility         | `min_age` / `max_age` + `gender_category` on the Team row — checked at roster-add.                      |
| Registration window              | `registration_opens_at` / `registration_closes_at` — auto-flipped by scheduled job.                     |
| Team branding                    | `primary_color` / `secondary_color` / `logo_url` (jersey colours + team crest).                         |
| Coach assignment                 | `coach_id` (Wave 2b Staff::Coach FK; declared but no constraint yet).                                   |
| Roster invariants                | Nightly reconciler ensures no (team, person) has 2+ active roster rows.                                 |

### 1.1 The four owned tables

- `teams` — the aggregate. Belongs to `Tenant` + `Organization` + `Branch`. Optional Season + AgeGroup (Wave 3 FKs, no constraint yet).
- `team_members` — polymorphic roster row. Belongs to `Tenant` + `Team`. `member_type` + `member_id` is polymorphic — no FK constraint.
- `team_trials` — probationary tryout. Belongs to `Tenant` + `Team`. `trialist_type` + `trialist_id` is polymorphic (or fully anonymous with captured name/phone).
- `event_teams` — Team's participation in an Event. Belongs to `Tenant` + `Team` + optional `Event` (Wave 3 FK, nullable pre-Wave-3).

None of these carry `application_id`, `organization_id`, or `region_id` — all cascade through `tenant_id` and (for team-scoped rows) through `team_id → team.branch_id`. Enforced by the tenancy-compliance-auditor.

### 1.2 Why polymorphic team_members?

The same roster shape serves three different business types:

- **Academy** — team roster is mostly `member_type='athlete'` (children coached toward competitions) with `member_type='coach'` rows for the assigned coaches.
- **Gym** — team roster is mostly `member_type='user'` rows (adults booking a class series). No Athlete profile needed.
- **School** — team roster is `member_type='athlete'` when the school ships the sports curriculum; `member_type='user'` when the "team" is really an academic cohort.

Making the FK polymorphic keeps ONE roster table across every business shape. The trade-off is no DB-level FK constraint on `member_id` — the observer enforces "this member_id resolves to a live row of the declared type" defensively, and the nightly reconciler catches orphans.

## 2. Tier gating

Teams are a load-bearing feature at every tier.

- **Small** — up to 10 teams. Trials + event-teams DISABLED (entitlements off). Capacity is a UI hint (`team_capacity_gating` off).
- **Medium** — up to 100 teams. Trials + event-teams ON. Capacity enforced.
- **Enterprise** — unlimited teams. Every sub-feature ON. Polymorphic `member_type='coach'` ON (once Wave 2b staff lands).

The entitlement keys are:

- `team_slot` (slot cap) — Small=10, Medium=100, Enterprise=null.
- `team_capacity_gating` (boolean) — enforce capacity + waitlist.
- `team_trials` (boolean) — the whole Trials module.
- `team_event_participation` (boolean) — the whole EventTeams module.
- `team_polymorphic_coach` (boolean) — allows `member_type='coach'` on TeamMember (blocked until Wave 2b Staff module lands).

## 3. The team lifecycle

The state machine of `teams.status`:

```
[created]  status=active
    │
    │─ pause (admin, temporary — new trials + members refused)
    ▼
[paused]
    │─ resume (admin)                    │─ archive (admin, terminal)
    ▼                                    ▼
[active]                              [archived]
                                         │─ restore (admin, rare)
                                         ▼
                                      [active]
```

Rules:

- **`active`** — normal state. Every operation permitted.
- **`paused`** — new trials + roster adds refused; existing members continue. Reversible.
- **`archived`** — terminal. Refused when the Team still has `status='active'` members OR pending trials. Hard-delete only after 730-day retention hold.
- **Restore** — allowed only when no successor team was created under the same `(tenant, organization, branch)` after the archive event (guards against accidental revival).

Every transition fires the matching event (see `events.json`). Every subscription-scoped operation (`bookings`, `sessions`, `attendance`, `memberships`) cascades through team status — a paused team blocks new session bookings; an archived team is invisible to enrollment.

## 4. The roster lifecycle

The state machine of `team_members.status`:

```
   (created)
      │
      ▼
   active
   │  │  │  │
   │  │  │  └─── graduated  (season end + is 18+; automated at Wave 3 season-end sweep)
   │  │  └────── suspended  (disciplinary; can transition back to active)
   │  └───────── injured    (medical; can transition back to active)
   └──────────── inactive   (voluntary leave; terminal for this Team)
```

Terminal-for-team states: `inactive`, `graduated`. A member returning to the team after leaving = new `TeamMember` row (historic row survives). Historic rows are preserved for compliance + participation lineage.

## 5. The trial → member conversion

A trial concludes when the coach records a decision:

```
   scheduled
      │
      ▼
   in_progress ─── no_show   (trialist didn't turn up)
      │
      ▼
   completed ─── converted   (accepted onto team — TeamMember row created ATOMICALLY)
      │           │
      │           └─── ConvertConfirmedTrialsJob fires TeamMemberJoined + TrialConvertedToMember
      │
      └─── rejected           (not accepted — recorded for anti-discrimination auditing)
```

`converted` is the SUCCESS terminal state. The conversion runs inside a DB transaction:

```sql
BEGIN;
UPDATE team_trials SET status='converted', decided_at=now(), decision_notes=? WHERE id=?;
INSERT INTO team_members (id, team_id, member_type, member_id, ...) VALUES (?, ?, ?, ?, ...);
COMMIT;
```

If the INSERT fails (uniqueness violation — the person is already on the team, or a capacity-race), the whole transaction rolls back and the trial stays `completed` (not `converted`). The coach can retry with `--force-replace-existing` (Wave 3 addition; not shipped in Wave 2) or manually resolve the conflict.

## 6. The polymorphic member_type

`TeamMember.member_type` is one of `athlete`, `coach`, `staff`, `user`. The type routes the `member_id` to a different aggregate table:

| `member_type` | Resolves to             | Notes                                                              |
| ------------- | ----------------------- | ------------------------------------------------------------------ |
| `athlete`     | Wave 3 `Athlete` model  | Common in academies + schools. Blocked pre-Wave-3.                 |
| `coach`       | Wave 3 `Coach` model    | The team's assigned coach as a roster row (distinct from `Team.coach_id`). |
| `staff`       | Wave 3 `Staff` model    | Team manager, medical, analyst — non-athlete non-coach team members. |
| `user`        | `user::User` model      | Adult member of a gym class or open-enrollment team.               |

`PolymorphicTeamMemberResolver` maps `(member_type, member_id) → Model | null`. Every consumer of `TeamMember.member` uses the resolver rather than reaching into the polymorphic branches directly.

**Anti-smuggling defence.** The `TeamMemberObserver` refuses on create when:

- `member_type='athlete'` AND the tenant lacks the sports entitlement (Wave 3).
- `member_type='coach'` AND the tenant lacks the `team_polymorphic_coach` entitlement (Wave 2b — blocked until staff lands).
- The resolved model's `tenant_id` differs from the team's `tenant_id` (cross-tenant FK smuggling).

## 7. Age + gender eligibility

Team.min_age / max_age / gender_category filter eligibility at the roster-add path:

```
member.dob:      2015-06-14  (age 11)
team.min_age:    10
team.max_age:    12
                                    → pass

member.gender:   'female'
team.gender_category: 'any'         → pass (any = open)

member.gender:   'male'
team.gender_category: 'female'      → fail (TEAM_GENDER_INELIGIBLE 422)
```

Age check runs ONLY when `trialist_type=athlete` (Athlete carries DOB) AND both bounds are set. Gender check runs when the member has a resolved gender. Missing data = check skipped, not failure — the observer never invents rejection.

## 8. Capacity + waitlist

`Team.capacity` is the max ACTIVE roster size. `Team.capacity_waitlist` is optional additional waitlist size. Both nullable.

Enforcement lives in `CapacityGate::allowsAdditional($team)`:

- When `team_capacity_gating` entitlement is OFF → always allow (capacity is a UI hint).
- When `capacity` is null → always allow.
- When active count < capacity → allow (route to team_members with status=active).
- When active count = capacity AND capacity_waitlist > 0 AND (active + inactive_pending_waitlist) < capacity + capacity_waitlist → allow (route to waitlist; not yet ACTIVE — Wave 3 Waitlist module will surface it).
- Else → refuse with `TEAM_CAPACITY_EXCEEDED` (402).

The 402 is deliberate — capacity refusal is an upsell signal (upgrade tier for higher capacity or bigger waitlist). Admins with the `team_capacity_override` permission can override.

## 9. Cascades

- `TeamArchived` → cascade every active member to status='inactive' + left_reason='team_archived' + fires TeamMemberLeft per member.
- `BranchClosed` → refuse the close if any team on that branch still has status='active'. Distinct from FK CASCADE — we deliberately block.
- `TenantErased` → FK CASCADE hard-deletes every team + member + trial + event_team row. Audit trails survive.
- `TeamCoachChanged` (via `coach_id` column change) → notify old + new coach, fires TeamCoachChanged event; audit-critical when team.min_age < 18 (child-safety notification).

## 10. What this module does NOT do

- **Cross-branch teams.** A team belongs to exactly ONE branch. Multi-branch cohorts are non-goals for Wave 2.
- **Cross-tenant polymorphic member_id.** Enforced at the observer.
- **Team merging.** Delete + recreate. Historic roster survives on the archived team.
- **Team splitting.** Delete + recreate the smaller teams. Historic roster survives on the original.
- **`application_id` on any row.** Cascades through `tenant_id → tenants.application_id`.
- **`region_id` on any row.** Cascades through `branch_id → branches.region_id`.
- **`scope_node_id` on any row.** Not a configuration consumer.
- **`member_id` FK constraint.** Polymorphic — the observer + reconciler enforce integrity.
- **Auto-provisioning "default team per branch".** Teams are explicit tenant admin actions.
- **Session scheduling.** Wave 3 Sports module composes `ResourceBooking` from `Team.schedule_pattern`. This module owns the visualisation shape only.

## 11. Cross-references

- `hierarchy.md` §1a — canonical vocabulary (Team, TeamMember).
- `hierarchy.md` §1b — Athlete/Coach/AthleteEnrollment are sport-domain rows in Wave 3, NOT owned here.
- `hierarchy.md` §2 — where team sits in the platform tree (below Branch).
- `hierarchy.md` §6 — module map (Teams entries).
- `hierarchy.md` §7 — tier matrix (team_slot: Small=10 / Medium=100 / Enterprise=null).
- `hierarchy.md` §14 — belongs-to matrix (Team → Tenant + Branch + Season + AgeGroup).
- `tenancy-columns.md` §3 — every owned row carries `tenant_id`.
- `tenancy-columns.md` §5 — forbidden columns (team never carries organization_id-as-shortcut, region_id, application_id, scope_node_id).
- `modules/platform/blueprints/branch/` — the parent branch module (status lifecycle mirrors branch active/paused/archived).
- `modules/platform/blueprints/facility/` — Wave 2b sibling; `resource_bookings.booked_for_team_id` is a placeholder FK pointing here.
