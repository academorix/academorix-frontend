# teams — changelog

## [Unreleased] — inception (Wave 2)

- Teams module authored. Four owned entities:
  - `Team` — the aggregate (name + branch + optional season + optional age_group + sport-key label).
  - `TeamMember` — polymorphic roster row (member_type + member_id points at Athlete / Coach / Staff / User).
  - `TeamTrial` — probationary tryout, atomically convertible to a `TeamMember` row.
  - `EventTeam` — a Team's registration + attendance + result for a Wave 3 Event (event_id nullable pre-Wave-3).
- Five entitlement gates:
  - `team_slot` (slot cap): Small=10 / Medium=100 / Enterprise=null.
  - `team_capacity_gating` (boolean): enforce capacity + waitlist (Medium+).
  - `team_trials` (boolean): the whole Trials sub-module (Medium+).
  - `team_event_participation` (boolean): the whole EventTeams sub-module (Medium+).
  - `team_polymorphic_coach` (boolean): allows `member_type='coach'` on TeamMember (blocked until Wave 2b Staff module lands).
- Team status lifecycle: active ↔ paused → archived (restore allowed unless successor exists).
- Team member status lifecycle: active ↔ suspended / injured / inactive / graduated. Historic rows preserved as compliance material.
- Trial lifecycle: scheduled → in_progress → completed → converted / rejected (also no_show / cancelled from earlier stages).
- Polymorphic roster: `TeamMember.member_type` ∈ {athlete, coach, staff, user}. `PolymorphicTeamMemberResolver` maps `(type, id) → Model`.
- Uniqueness invariant: `(tenant_id, team_id, member_type, member_id)` unique WHERE `status='active'` AND `deleted_at IS NULL`. Historic inactive rows survive.
- Cascades: `TeamArchived` → cascade every active member to inactive; `BranchClosed` → refused when active teams reference the branch; `TenantErased` → FK CASCADE hard-deletes.
- Trial → member atomic conversion inside a single DB transaction. Refuses on uniqueness violation without partial commits.
- Age + gender eligibility checked at roster-add. Skipped when data is missing (never invents rejection).
- Capacity + waitlist enforcement in `CapacityGate::allowsAdditional()`. Refused with `TEAM_CAPACITY_EXCEEDED` (402) when full. Admins with `team_capacity_override` permission bypass.
- Nightly reconciler `ReconcileTeamMemberActiveInvariantJob` sweeps for duplicate active rows on the same (team, person). Counter `academorix.teams.member_invariant.violations` must stay at 0.
- Child-safety notification chain on `TeamCoachChanged` when team.min_age < 18 (or max_age < 18) — critical-severity audit + notification.
- Registration windows auto-flip via `OpenClosePendingRegistrationsJob` (every 5 min).
- Retention: active teams never expire; archived teams held 730 days then hard-delete; team members retained indefinitely as historic roster; trials retained 3 years (rejected trials survive for anti-discrimination auditing).
- Realtime broadcasts: `tenant.{id}.teams`, `team.{id}.members`, `team.{id}.trials`.
- Seven notification categories (member-joined, member-left, registration-opening, schedule-changed, trial-scheduled, trial-decision, coach-changed).
- SDUI: 5 team screens + 3 team-member screens + 4 team-trial screens + 4 event-team screens + 4 widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `organization`, `region`, `branch`, `user`, `entitlements`.
- Extended by NONE in Wave 2 (Wave 3 sports + Wave 4 finance modules will consume; declared under `planned_consumers` in module.json).
- Wave 2 inception release.

### Design notes

- Teams does NOT carry `organization_id`-as-shortcut, `region_id`, `application_id`, or `scope_node_id` on any row. Organization comes via Team → Branch → Organization. Region comes via Team → Branch → Region. Application cascades through Tenant. Enforced by tenancy-compliance-auditor.
- `team_members` uses polymorphic `(member_type, member_id)` with NO DB-level FK constraint. Integrity enforced by the observer (creating: refuse when resolved model's tenant_id != team.tenant_id) + the nightly reconciler.
- Sport-agnostic by construction: `sport_key` is a nullable label; `team_type` classifies broadly (squad / class / cohort / group / crew). Wave 3 sports module tightens sport_key to a registry-backed enum.
- `season_id` + `age_group_id` are nullable declarations — no constraint until Wave 3 Sports module lands with the parent tables.
- `event_id` on EventTeam is nullable pre-Wave-3. Wave 3 makes it required + FK-constrained.
- `coach_id` is a nullable declaration — no constraint until Wave 2b Staff module lands with the Coach model.
- Trial rejection reasons NEVER appear in analytics (anti-discrimination protection). They live only in `decision_notes` on the audit row.
- Team member historic rows (status=inactive/graduated/injured/suspended) are compliance material. Never delete without a 7-year retention pipeline.
- The `TeamMember` roster row is DISTINCT from `TenantMember` (User↔Tenant pivot in identity module). Different ULID prefix (`trm_` vs `tmb_`), different concept — do not conflate.
