# coaching — changelog

## [Unreleased] — inception (Wave 3b)

- Coaching module authored. Four owned entities:
  - `CoachingProfile` (`cop_` prefix) — per-Staff satellite marking that Staff as an active Coach with sport specialization + bio + availability + reference hourly-rate.
  - `CoachAssignment` (`cas_` prefix) — polymorphic pivot Coach ↔ Session / Team / Event with role (head_coach / assistant_coach / observer / substitute) + date bounds.
  - `CoachCertification` (`ccf_` prefix) — held credentials ledger; drives 90 / 30 / 7-day expiration cadence.
  - `CoachSkillRating` (`csr_` prefix) — per-Coach per-Sport/Discipline/Position rating (1-5 stars OR level enum).
- Seven entitlement gates: `coaching_capture` (master feature), `coaching_profile_slot` (integer cap), `coaching_advanced_certifications` (Medium+ workflow), `coaching_skill_ratings` (Medium+), `coaching_multi_branch` (Medium+), `coaching_public_directory` (Medium+), `coaching_extended_retention` (Enterprise).
- Load-bearing invariants:
  - **One CoachingProfile per Staff** (partial-unique on `(tenant_id, staff_id) WHERE deleted_at IS NULL`).
  - **One head_coach per assignable** (partial-unique on `(tenant_id, assignable_type, assignable_id, role='head_coach')` when active).
  - **No assignment without a verified + active profile** (observer refusal).
  - **No self-rating** (observer refusal on `rated_by_user.staff_id == coaching_profile.staff_id`).
  - **Duplicate cert refusal** on `(tenant_id, coaching_profile_id, issuing_body, certification_name, issued_at)`.
- Cascade paths: Staff offboard → CoachingProfile deactivate + cancel open assignments; CoachingProfile deactivate → cancel every open assignment; TenantErased → cascade.
- Certification workflow: capture → verify → expiration cadence (90 / 30 / 7 / 0 days). Sync webhook integration deferred to Wave 4+.
- Skill rating: two scales (`stars_1_5` OR `level_5_stage`); polymorphic on Sport / Discipline / Position from `sports/registry`; 2-year default expiry (5 years with `coaching_extended_retention`).
- Retention: profiles 7y post-deactivation (10y Enterprise); assignments 7y post-end; certifications while-active + 7y post-expiration; ratings 2y (5y Enterprise).
- 14 published events. Seven notification categories. Six broadcast channels: tenant / cert-scoped / profile-scoped / user-scoped.
- Six scheduled jobs (Notify Expiring / Expired / Assignment-Ending / Availability-Conflict / Purge-Ratings / Roster-Report).
- SDUI: 13 screens + 4 widgets. Coach self-service dashboard for the coach's own /me surface.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `user`, `staff`, `branch`, `sports/registry`, `sports/season`, `sports/athlete`, `sports/athlete-enrollment`, `sports/event`, `sports/session`.
- Extended by NONE. Planned consumers: `sports/attendance`, `sports/session` (extended reads), `notifications`, `growth::analytics`.

### Design notes

- No `application_id` / `region_id` / `organization_id` / `scope_node_id` on any owned row. All cascade through Tenant → Branch → Staff.
- Coach is NOT a first-class aggregate — Coach IS a Staff row with a live CoachingProfile satellite. No `Coach` model, no `coa_` ULID prefix.
- Reference `hourly_rate_cents` is NOT payroll — it's a scheduling planning field. Payroll writeback belongs in Finance.
- Skill ratings are ADMIN-authored, not customer-authored. Customer-facing reviews are out-of-scope (deferred).
- `Coach` entity previously scaffolded in the platform Staff module (`modules/platform/blueprints/staff/`) is superseded by this sports-domain module — Staff retains generic employment; sport-specific coaching moves here per the sports-domain reorganization.

### ULID prefix registration

- `cop_` (CoachingProfile), `cas_` (CoachAssignment), `ccf_` (CoachCertification), `csr_` (CoachSkillRating). Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`. 3-char lowercase.

### Wave 3b → 4 migration notes

- `sports/attendance` module lands + reads `CoachAssignment` for check-in eligibility.
- Notification templates for the expiration cadence localize into per-tenant terminology (`Coach` → `Trainer` on gym-type tenants; `Instructor` on academy-type tenants).
- Third-party verification-body webhook integration (USSF / NASM / Red Cross public APIs) lands as an optional `CoachingProfileVerifier` binding replacement.
- Customer-facing coach picker at booking time gated on `coaching_public_directory` — the Wave 4 finance/booking flow surfaces verified coaches to end customers.
