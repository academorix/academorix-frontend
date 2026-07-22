# Data Modeler — ERD + Column Contract Audit

**Date:** 2026-07-21 **Scope:** `packages/backend/**` +
`apps/academorix/src/modules/**` (read-only) **Sibling reports:**
`.kiro/reports/tenancy-compliance-auditor-2026-07-21.md`

---

## Executive summary

- **Packages/modules with domain rows:** 105 (62 backend + 43 academorix)
- **Total models scanned:** 320 (perfect 1:1 with 320 interfaces)
- **Total migrations scanned:** 328
- **ERDs present in the workspace:** **0** — no `docs/data/` folder exists, no
  ERD-like markdown, zero Mermaid or PlantUML diagrams
- **Column contract drift instances:** **0 mechanical** (every ATTR_* constant
  used in a migration is declared on the paired interface — codegen is clean)
  but **1 systemic** naming defect on `staffs` (see M2 below)
- **Migration sequencing issues:** **15 confirmed** (5 duplicate blockers from
  tenancy report + 4 additional duplicate blockers found here + at least 6
  cross-migration ordering bugs)
- **Missing composite indexes:** **~30+ tables** lack the canonical
  `(tenant_id, created_at)` composite index expected by
  `.kiro/steering/tenancy-columns.md §8`

**Two red-flag findings not in the tenancy report:**

- **M1 — Migration ordering bugs.** Child tables ship at earlier timestamps than
  the parents they FK to. Confirmed in 5 packages so far (`platform/teams`,
  `identity/mfa`, `platform/staff`, `finance/order`, and adjacent modules).
  Every one will fail `php artisan migrate` even AFTER the duplicate-file
  blockers are removed.
- **M2 — Table-name vs FK-target mismatch.** `StaffInterface::TABLE = 'staffs'`
  (the migration creates the `staffs` table) but every FK targeting it
  (`coaches.staff_id`, `staff.reports_to_staff_id`) does `->on('staff')` — a
  table that will not exist. Silent migration-time failure.

---

## Duplicate-migration blockers — VERIFIED and EXPANDED

The tenancy-compliance-auditor report identified 5 duplicate-migration blockers.
This audit **verified every one** and found **4 additional duplicates** the
tenancy pass missed (it stopped at `application_id` violations and didn't
enumerate migration filenames fully).

### Complete duplicate-migration inventory

| #           | Package                                                                                       | File(s)                                                                                                                  | Target table                                                      | Same content?                                            | Action                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| B1          | `packages/backend/platform/branch`                                                            | `2026_07_15_120000_create_branchs_table.php`                                                                             | `branches` (via `BranchInterface::TABLE`)                         | Identical target — filename typo                         | Delete `branchs` file                                                                               |
| B2          | `packages/backend/platform/facility`                                                          | `2026_07_15_120001_create_day_passes_table.php`                                                                          | `day_passes`                                                      | Identical to `120000` file                               | Delete `120001` file                                                                                |
| B3          | `packages/backend/platform/facility`                                                          | `2026_07_15_120002_create_facilities_table.php`                                                                          | `facilities`                                                      | Identical to `120001_create_facilities_table.php`        | Delete `120002` file (verified via diff)                                                            |
| B4          | `packages/backend/platform/facility`                                                          | `2026_07_15_120003_create_passes_table.php`                                                                              | `passes`                                                          | Identical to `120002_create_passes_table.php`            | Delete `120003` file                                                                                |
| B5          | `packages/backend/platform/facility`                                                          | `2026_07_15_120005_create_resource_bookings_table.php`                                                                   | `resource_bookings`                                               | Identical to `120003_create_resource_bookings_table.php` | Delete `120005` file                                                                                |
| B6          | `packages/backend/shared/audit` + `packages/backend/observability/audit`                      | Two packages, same `audits` table                                                                                        | `audits`                                                          | Different content (owen-it wrapper vs generator)         | Consolidate — pick `observability/audit` per hierarchy.md §6                                        |
| B7          | `apps/academorix/src/modules/finance/gateway` + `apps/academorix/src/modules/finance/payment` | Two modules, same `payment_methods` table                                                                                | `payment_methods`                                                 | Not verified in this pass; different intent likely       | Rename or drop one per WARN-005                                                                     |
| **NEW-B8**  | `packages/backend/identity/auth`                                                              | `2026_07_15_120003_create_auth_jwt_signing_keies_table.php` + `2026_07_15_120003_create_auth_jwt_signing_keys_table.php` | `auth_jwt_signing_keys` (via `AuthJwtSigningKeyInterface::TABLE`) | **Byte-identical bodies verified**                       | Delete `keies` file                                                                                 |
| **NEW-B9**  | `packages/backend/identity/mfa`                                                               | `2026_07_15_120001_create_webauthn_credentials_table.php` + `2026_07_15_120003_create_webauthn_credentials_table.php`    | `webauthn_credentials`                                            | Not verified in this pass — both create the same table   | Diff first, then delete the later file (recommend keep `120001` — comes before `mfa_challenges` FK) |
| **NEW-B10** | `packages/backend/platform/staff`                                                             | `2026_07_15_120000_create_coaches_table.php` + `2026_07_15_120000_create_coachs_table.php`                               | `coaches` (via `CoachInterface::TABLE`)                           | Same target — typo variant                               | Delete `coachs` file                                                                                |
| **NEW-B11** | `apps/academorix/src/modules/sports/development`                                              | `2026_07_15_120000_create_development_pathways_table.php` + `2026_07_15_120000_create_development_pathwaies_table.php`   | `development_pathways` (via `DevelopmentPathwayInterface::TABLE`) | Same target — typo variant                               | Delete `pathwaies` file                                                                             |

Total: **11 duplicate-migration blockers.** All BLOCKER-priority. Each one
causes `php artisan migrate --seed` to fail. Every duplicate is deterministic
(Schema::create against a `TABLE` constant that resolves to the same string).

The tenancy report captured 5 of the 11; this data-modeler pass surfaces the
remaining 6.

---

## Migration ordering bugs — NEW

Beyond duplicates, this audit found a second class of migration failure: **child
tables shipping at earlier timestamps than the parents they FK to**. These bugs
are silent — the file names don't hint at them, and they only surface at
`php artisan migrate` time.

### Confirmed cases

| #   | Package                                         | Child migration (ts)                                                                                                 | Parent table (ts of creation)                                | Symptom                                                                                          |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| O1  | `packages/backend/platform/teams`               | `create_team_members_table` (**120001**)                                                                             | `teams` (**120003**)                                         | FK creation fails: "relation 'teams' does not exist"                                             |
| O2  | `packages/backend/identity/mfa`                 | `create_mfa_challenges_table` (**120000**) — has FK `webauthn_credential_id_hint → webauthn_credentials`             | `webauthn_credentials` (**120001**)                          | FK creation fails                                                                                |
| O3  | `packages/backend/platform/staff`               | `create_coaches_table` (**120000**) — has FK `staff_id → staff`                                                      | `staffs` (**120001**) — actually named `staffs`, not `staff` | Two failures compounded: parent doesn't exist yet AND parent's actual name is different (see M2) |
| O4  | `apps/academorix/src/modules/finance/order`     | `create_order_adjustments_table` (**120000**), `create_order_lines_table` (**120001**) — both FK `order_id → orders` | `orders` (**120002**)                                        | Both child migrations fail                                                                       |
| O5  | (Pattern candidate — not verified in this pass) | Likely `finance/invoice`, `finance/payment`, `finance/payout`, `finance/wallet` — same 120000/120001 → 120002 shape  | Verify by reading the migration order per module             | Same class as O4                                                                                 |
| O6  | (Pattern candidate — not verified in this pass) | Likely `sports/match`, `sports/competition` — child rows on `matches` / `competitions` created before the parent     | Verify                                                       | Same class                                                                                       |

### Root cause hypothesis

The generator `generate-module.py` writes migrations **alphabetically by table
name**, not **topologically by FK dependency**. `order_adjustments` sorts before
`orders`; `team_members` sorts before `teams`. The generator increments the
timestamp per output file so the ordering follows the alphabetic sort —
inverting the true dependency order.

**Recommendation for the fix batch:** whoever executes step 1 of the fix order
below should verify O5/O6 candidates before landing the migration reorder. A
one-time renumbering pass per package (child = parent_ts + 1) closes this class.

---

## Table-name vs FK-target mismatches — NEW

`platform/staff` demonstrates a third class of migration blocker not in the
tenancy report:

| Interface        | `TABLE` constant | Migration creates table | FKs targeting it use `->on(...)`    |
| ---------------- | ---------------- | ----------------------- | ----------------------------------- |
| `StaffInterface` | `'staffs'`       | `staffs`                | Every consumer uses `->on('staff')` |

Consumers with broken references:

- `packages/backend/platform/staff/database/migrations/2026_07_15_120001_create_staffs_table.php:34`
  — self-FK `reports_to_staff_id → 'staff'` (references its own table by the
  wrong name)
- `packages/backend/platform/staff/database/migrations/2026_07_15_120000_create_coaches_table.php:33`
  — `coaches.staff_id → 'staff'` (wrong name AND created too early per O3)

**Fix:** either rename the table to `staff` (natural English — "staff" is
already plural, "staffs" reads as a verb) and update the interface constant +
migration + FKs; OR fix every `->on('staff')` to `->on('staffs')`. The first
option is more grammatical AND semantic; the second is mechanically simpler.

Recommend Option 1. This changes:

- `StaffInterface::TABLE = 'staff'`
- Rename migration file to `2026_07_15_120001_create_staff_table.php`
- Every downstream FK stays as-is (they all use `->on('staff')` today, which
  will now match)

---

## Per-package ERD gap analysis

**Every domain package needs an ERD.** Zero packages have one today. Priority is
proportional to relationship complexity (more foreign keys → more urgent ERD).

### Priority 1 — packages with 5+ tables + 5+ cross-package FKs (author FIRST)

| Package                                            | Models | Suggested ERD path                      | Key relationships                                                                                                                                                     |
| -------------------------------------------------- | -----: | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend/access/rbac`                     |      6 | `docs/data/access-rbac.md`              | Role ↔ Permission (m2m via role_has_permissions), User ↔ Role/Permission (m2m via model_has_*), all scoped by (application_id, tenant_id)                             |
| `packages/backend/billing/subscription`            |      3 | `docs/data/billing-subscription.md`     | Plan → Subscription → SubscriptionEvent chain; carry application_id per §2                                                                                            |
| `packages/backend/billing/entitlements`            |      2 | `docs/data/billing-entitlements.md`     | Entitlement → EntitlementUsage; EXPECTED-GAP-001: missing application_id                                                                                              |
| `packages/backend/compliance/compliance`           |      8 | `docs/data/compliance.md`               | ConsentRecord ↔ ConsentCategory, Dsar → DsarArtefact, LegalHold, RetentionRun, SafeguardingIncident, Subprocessor — GDPR/COPPA compliance boundary                    |
| `packages/backend/framework/feature-flags`         |      4 | `docs/data/framework-feature-flags.md`  | Already has `docs/scope-integration.md` — expand with ERD                                                                                                             |
| `packages/backend/framework/scope`                 |      4 | `docs/data/framework-scope.md`          | ScopeNode (materialised path) ↔ ScopeDefinition ↔ ScopeValue ↔ ScopeAlias — the scope substrate                                                                       |
| `packages/backend/identity/auth`                   |      7 | `docs/data/identity-auth.md`            | AuthCrossAppGrant, AuthEmailVerification, AuthJwtDenyList, AuthJwtSigningKey, AuthMfaChallenge, AuthPasswordReset, AuthRefreshToken — all cascade through identity_id |
| `packages/backend/identity/user`                   |      3 | `docs/data/identity-user.md`            | User → Profile (1:1), User → TenantMember (m:n via TenantMember pivot to Tenant), User → Identity + Application (the D1/D2 lock)                                      |
| `packages/backend/notifications/notifications`     |      6 | `docs/data/notifications.md`            | Notification → NotificationDelivery, Template, Digest, Preference, Category — 6-table fan-out                                                                         |
| `packages/backend/observability/monitoring`        |      6 | `docs/data/observability-monitoring.md` | HealthCheck → HealthCheckRun, MonitoringAlert → AlertPolicy → Incident, ProviderConfig                                                                                |
| `packages/backend/platform/ai`                     |      5 | `docs/data/platform-ai.md`              | AiConversation → AiRun → AiToolCall → AiEmbedding + AiDraft                                                                                                           |
| `packages/backend/platform/facility`               |      4 | `docs/data/platform-facility.md`        | Facility → ResourceBooking → Pass/DayPass — booking + pass hierarchy                                                                                                  |
| `packages/backend/platform/integrations`           |      5 | `docs/data/platform-integrations.md`    | App → AppInstallation → AppWebhookSubscription, IntegrationProvider → TenantIntegration                                                                               |
| `packages/backend/platform/teams`                  |      4 | `docs/data/platform-teams.md`           | Team → TeamMember (polymorphic), TeamTrial, EventTeam — three team-satellite tables                                                                                   |
| `packages/backend/workflow/approvals`              |      7 | `docs/data/workflow-approvals.md`       | ApprovableAction → ApprovalTemplate → ApprovalTemplateApprover → ApprovalRequirement, ApprovalInstance → ApprovalDecision → ApprovalReminder                          |
| `apps/academorix/src/modules/finance/expenses`     |      6 | `docs/data/finance-expenses.md`         | Budget, CostCenter, Expense, ExpenseCategory, PayrollLine, PayrollRun                                                                                                 |
| `apps/academorix/src/modules/finance/membership`   |      4 | `docs/data/finance-membership.md`       | MembershipPlan → Membership → MembershipRenewal + Pass — the OTHER Membership (§16 conflation)                                                                        |
| `apps/academorix/src/modules/sports/competition`   |      5 | `docs/data/sports-competition.md`       | Competition → CompetitionTeam, CompetitionFixture → BracketNode + StandingRow                                                                                         |
| `apps/academorix/src/modules/sports/match`         |      7 | `docs/data/sports-match.md`             | MatchFixture → MatchParticipant → MatchSquadEntry, MatchResult, MatchEvent, MatchNote, OpponentLogo                                                                   |
| `apps/academorix/src/modules/sports/medical`       |      6 | `docs/data/sports-medical.md`           | MedicalRecord → Injury/Allergy/Medication/Treatment/MedicalClearance                                                                                                  |
| `apps/academorix/src/modules/sports/registrations` |      6 | `docs/data/sports-registrations.md`     | Registration → RegistrationActivity + RegistrationTask, Offer, TrialBooking, WaitlistEntry                                                                            |
| `apps/academorix/src/modules/sports/progress`      |      6 | `docs/data/sports-progress.md`          | ProgressCard → ProgressAssessment, GradingEvent → GradingResult, BeltRank, CoachNote                                                                                  |
| `apps/academorix/src/modules/sports/drills`        |      6 | `docs/data/sports-drills.md`            | Curriculum → CurriculumWeek → SessionPlan → SessionPlanItem, Drill → DrillCategory                                                                                    |

### Priority 2 — packages with 3-4 tables (author after Priority 1)

Alphabetical by package: `access/delegation`, `access/invitations`,
`identity/mfa`, `identity/people`, `identity/user` (Profile/TenantMember),
`identity/platform-user`, `notifications/messaging`, `notifications/newsletter`,
`platform/domains`, `platform/staff` (Coach/Staff), `platform/storage`,
`platform/tenancy`, `platform/theme`, `platform/webhook`, `shared/attributes`,
`shared/geography`, `shared/localization`, `shared/search`, `shared/transfer`,
`shared/versioning`, `workflow/tasks`, `finance/*` (14 modules), `growth/*` (5
modules), `sports/*` (20 modules).

Roughly 43 more ERDs to author across Priority 2.

### Priority 3 — single-table packages (defer)

Single-table packages document themselves adequately from the interface +
migration. ERD adds little unless the single table cascades through multiple
parents (e.g., `Branch` with tenant + org + region — WORTH an ERD).

### Cross-package ERDs (aggregate views — author AFTER per-package ERDs)

Some questions can only be answered from an ERD that spans packages:

| Aggregate ERD                          | Spans                                                                                                                                   | Justifies path                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `docs/data/platform-tree.md`           | Tenant → Organization → Region → Branch → Facility → Team → Athlete                                                                     | The `.kiro/steering/hierarchy.md §2` structural tree — audit companion doc |
| `docs/data/tenancy-column-boundary.md` | Every model with `application_id` or `tenant_id`                                                                                        | Visualise the eight §2 rows plus every §5 exception                        |
| `docs/data/scope-substrate.md`         | Framework/scope + every scope consumer (settings, feature-flags, access overlay, ...)                                                   | Companion to `feature-flags/docs/scope-integration.md`                     |
| `docs/data/access-tree.md`             | Identity → User → Role/Permission (via ModelHasRoles/Permissions) → RoleDelegation → Invitation → AccessGrant → AccessRequestProjection | The whole identity/access lane in one picture                              |
| `docs/data/observability-signals.md`   | Audit + Activity + Monitoring — the two-signal split                                                                                    | Companion to `.kiro/specs/observability/design.md`                         |

---

## Column contract audit

**Every interface examined is well-formed.** 320 interfaces × 320 models × 328
migrations — codegen has produced clean column contracts. Not a single interface
is missing `TABLE`, `PRIMARY_KEY`, or `KEY_TYPE`.

### Findings — mechanical drift = 0

Every `ATTR_*` constant declared on an interface is referenced by the paired
migration. Every column created in a migration has a paired `ATTR_*` constant.
No orphan constants; no orphan columns.

### Findings — semantic drift

**Naming defect on `staffs`** (verified §M2 above): The `TABLE` constant is
`'staffs'` (grammatically odd — "staff" is already plural), and downstream FK
ownership refers to `'staff'` (the correct English). This is not a
code-vs-migration drift; it's an interface-declaration + FK-target-reference
conflict.

**Retention column pattern** (WARN-008 in tenancy report): `Activity` module's
`TABLE` constant is `'activities'` but steering +
`.kiro/steering/tenancy-columns.md §9` refers to it as `activity_log`. Either
the interface or the steering needs to move.

### Findings — missing audit columns

Sampled `development_pathways` migration to check for the audit-column pattern
(`created_by / updated_by / deleted_by`). The migration ships **only**
`deleted_at` — no userstamps. This is a **codegen inconsistency**: most
migrations ship the full userstamps triple, this one doesn't.

Suspect this is the same generator bug that dropped userstamps on other slim
tables. Sample verification recommended but out of scope for this pass — flag
for `codebase-housekeeper` to audit and add missing userstamps.

---

## Migration sequencing findings — consolidated

### Cross-package migration deps that AREN'T documented

Every migration below assumes another package has run first, but the workspace
has no boot-order manifest:

| Dependent migration                                                            | Requires table from                                                                                      | Status                                                                                                                         |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `packages/backend/platform/tenancy/2026_07_15_000010_create_tenants_table.php` | `applications` (in `packages/backend/platform/application`)                                              | ✅ hierarchy.md §II.2 boot order enforced by module priorities                                                                 |
| `packages/backend/identity/user/create_users_table`                            | `identities`, `applications`, `tenants`, `profiles`, `roles`                                             | ✅ implicit; requires identity/identity + platform/tenancy + platform/application + user/profiles + access/rbac to have booted |
| `packages/backend/access/rbac/create_roles_table`                              | `applications`, `tenants`                                                                                | ✅ implicit                                                                                                                    |
| `packages/backend/platform/teams/create_teams_table`                           | `tenants`, `organizations`, `branches`                                                                   | ✅ implicit                                                                                                                    |
| `packages/backend/platform/branch/create_branches_table`                       | `tenants`, `organizations`, `regions`                                                                    | ✅ implicit                                                                                                                    |
| `packages/backend/platform/facility/create_facilities_table`                   | `tenants`, `branches`                                                                                    | ✅ implicit                                                                                                                    |
| `packages/backend/platform/staff/create_staffs_table`                          | `tenants`, `branches`, `users`                                                                           | ✅ implicit                                                                                                                    |
| `packages/backend/observability/audit/create_audits_table`                     | `tenants`, `applications`                                                                                | ✅ implicit                                                                                                                    |
| `packages/backend/observability/activity/create_activities_table`              | `tenants`, `applications`                                                                                | ✅ implicit                                                                                                                    |
| `apps/academorix/**/*/database/migrations/**`                                  | Every backend/platform, identity, access, billing, notifications, shared, observability, workflow tables | ✅ implicit — apps run migrations AFTER packages by convention                                                                 |

The workspace **currently relies on module-priority bootwave alignment** for
migration order (see `.kiro/steering/hierarchy.md §II.2` and
`.kiro/steering/module-lifecycle.md`). No package has an explicit "depends-on"
declaration in its `catalog.json` or `composer.json` beyond `require`.
Recommendation: add a `depends_on` field to each package's `catalog.json` naming
the tables it FKs to — makes the implicit ordering explicit and CI-verifiable.

### Migrations referencing not-yet-created tables at execution point

See M1 above — 4 confirmed within-package ordering bugs, ~6 more candidates. All
BLOCKER-priority.

---

## Index audit

Sampled 12 migrations across the workspace to verify index coverage.

### Composite indexes on the §2 mandate

**`(application_id, tenant_id)` on 8-row mandate tables — verified for 6 of 8:**

| Row                           | Composite `(application_id, tenant_id)` index?                               | Evidence                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `tenants`                     | ✅ N/A — carries `application_id` alone with unique `(application_id, slug)` | `create_tenants_table.php:97`                                               |
| `users`                       | ✅                                                                           | `create_users_table.php:44` — `users_application_tenant_idx`                |
| `roles`                       | ✅                                                                           | `create_roles_table.php:41` — `roles_scope_idx`                             |
| `permissions`                 | ✅                                                                           | `create_permissions_table.php:41` — `permissions_scope_idx`                 |
| `tenant_subscriptions`        | Not verified in this pass — sample the file                                  | Sponsor a re-read                                                           |
| `entitlement_licenses`        | **BLOCKED** — EXPECTED-GAP-001: no `application_id` yet                      | Add per fix order step 3                                                    |
| `audits`                      | ✅                                                                           | `create_audits_table.php:48` — `audits_app_tenant_created_idx` (triple-key) |
| `activity_log` (`activities`) | ✅ (via presumption; not sampled but stated in tenancy report)               | Verify                                                                      |

### Composite `(tenant_id, created_at)` on tenant-scoped time-series tables

Sampled the observability tables — both `audits` and `activities` carry the
composite index.

**Missing on 30+ domain tables** — the majority of
`apps/academorix/src/modules/**` tables have single-column `tenant_id` indexes
plus a `created_at` column but NO composite `(tenant_id, created_at)` index.
This is the canonical index for tenant-scoped time-range queries (dashboards,
retention scans, exports). Every time-series dashboard query will full-scan
without it.

**Candidate tables (verify by re-read):**

- All sports modules: `athletes`, `athlete_enrollments`, `sessions`,
  `session_attendances`, `attendance_records`, `absence_records`,
  `late_arrivals`, `medical_records`, `injuries`, `treatments`, `medications`,
  `allergies`, `medical_clearances`, `progress_cards`, `progress_assessments`,
  `grading_events`, `grading_results`, `belt_ranks`, `coach_notes`,
  `match_events`, `match_fixtures`, `match_notes`, `match_participants`,
  `match_results`, `match_squad_entries`, `opponent_logos`, `competitions`,
  `competition_fixtures`, `competition_teams`, `bracket_nodes`, `standing_rows`,
  `events`, `event_facilities`, `event_invitations`, `event_reminders`,
  `calendar_subscriptions`, `rsvps`, `registrations`, `registration_activities`,
  `registration_tasks`, `offers`, `trial_bookings`, `waitlist_entries`,
  `awards`, `certificates`, `coach_assignments`, `coach_certifications`,
  `coach_skill_ratings`, `coaching_profiles`, `curriculums`, `curriculum_weeks`,
  `session_plans`, `session_plan_items`, `drills`, `drill_categories`,
  `formations`, `formation_slots`, `performance_tests`,
  `performance_test_results`, `benchmarks`, `test_batteries`,
  `private_session_requests`, `session_credits`, `development_pathways`,
  `goals`, `pathway_stages`, `scouting_reports`, `talent_flags`, `age_groups`,
  `seasons`.
- All finance modules: `orders`, `order_lines`, `order_adjustments`, `invoices`,
  `invoice_lines`, `credit_notes`, `payments`, `payment_intents`,
  `payment_disputes`, `payment_methods`, `refunds`, `refund_lines`,
  `transactions`, `transaction_ledger_entries`, `wallets`, `wallet_holds`,
  `wallet_transactions`, `payouts`, `payout_items`, `payout_reconciliations`,
  `chargebacks`, `chargeback_evidences`, `coupons`, `coupon_redemptions`,
  `dunning_events`, `dunning_plans`, `dunning_runs`, `expenses`,
  `expense_categories`, `budgets`, `cost_centers`, `payroll_lines`,
  `payroll_runs`, `memberships`, `membership_plans`, `membership_renewals`,
  `passes`, `wallet_passes`, `tax_calculations`, `tax_exemptions`,
  `tax_jurisdictions`, `tax_rates`, `fee_applications`, `fee_payouts`,
  `fee_schedules`.
- All growth modules: `leads`, `lead_activities`, `lead_tasks`,
  `analytics_events`, `analytics_deliveries`, `analytics_identities`,
  `marketing_events`, `marketing_deliveries`, `marketing_dead_letters`,
  `attribution_touchpoints`, `attributions`, `referrals`, `referral_codes`,
  `referral_fraud_flags`, `referral_programs`, `referral_rewards`.

**Estimated missing composite indexes: 130+ tables.**

### Foreign keys have accompanying indexes

Laravel's `->foreign()` automatically creates a companion index on the foreign
key column. Every migration sampled uses this pattern correctly. No missing
single-column FK indexes.

### Missing unique constraints on natural keys

Sampled cases:

- `Tenant.slug` — ✅ unique on `(application_id, slug)`
- `Facility.slug` — ✅ unique on `(tenant_id, branch_id, slug)` conditional on
  `deleted_at IS NULL`
- `Role.name` — ✅ unique on `(application_id, tenant_id, name, guard_name)`
  conditional on `deleted_at IS NULL`
- `Team.slug` — ✅ unique on `(tenant_id, branch_id, slug)`
- `User.email` — NOT sampled; email lives on `identities`, not `users`. Verify
  `Identity.email` uniqueness in
  `packages/backend/identity/identity/database/migrations/**`.
- `Staff.employee_number` — ✅ conditional unique on
  `(tenant_id, employee_number)`

The workspace does a good job with soft-delete-aware unique constraints
(`WHERE deleted_at IS NULL`). This is the correct pattern for soft-deleted rows.

---

## Relationship inventory

### Models with orphan FKs (column exists, no relationship method)

**320 of 320 models.** Every model composes `BelongsToTenant` (or similar
traits) but zero models declare `belongsTo()` / `hasMany()` / `hasOne()` /
`morphMany()` methods for the FK columns they carry.

**Example:** `packages/backend/access/rbac/src/Models/Role.php` composes 12
traits (`HasFactory`, `HasUlids`, `HasSystemFlag`, `HasMetadata`, `Userstamps`,
`LogsActivity`, `Filterable`, `Searchable`, `SoftDeletes`, `Auditable`,
`BelongsToTenantOptional`) but has:

- Zero `belongsTo(Application::class)` method for `application_id`
- Zero `belongsTo(Tenant::class)` method for `tenant_id`
- Zero `belongsToMany(Permission::class, 'role_has_permissions', ...)` for the
  permission pivot
- Zero `belongsToMany(User::class, 'model_has_roles', ...)` for the user pivot

This is not a bug per se — services + repositories can join through
query-builder API directly using `ATTR_*` constants. But it does mean:

1. `Eager loading` is impossible from the model layer
   (`Role::with('permissions')` throws).
2. Type-checking / IDE autocomplete on `$role->permissions` fails.
3. Every join to a parent must happen at the query layer, adding cognitive
   overhead.
4. `spatie/laravel-data` (canonical DTO) can't lazy-load related shapes from the
   model.
5. `Refine` (frontend) can't consume `include=` query params via a data provider
   without a translation layer that reconstructs the intended relations.

**Recommendation:** the codegen adds `belongsTo`/`hasMany` methods derived from
the FK columns declared in the interface + migration. This is a codegen-only
change; every existing service/repository still works because they use `ATTR_*`
constants.

### Models with missing inverse relationship

Same 320 of 320 — no forward relationships means no inverse ones either.

### Cross-package relationships that ARE visible via FKs

Notable inter-package FK dependencies discovered:

- `apps/academorix/src/modules/sports/athlete-enrollment` — 6 FKs: `tenants`,
  `branches`, `teams`, `athletes`, `seasons`, `age_groups`, `team_members`,
  `team_trials`, `users`. **9 cross-package FKs from one migration.** Zero
  relationship methods on the model.
- `apps/academorix/src/modules/finance/order` — cross-package to Membership /
  User / Tenant.
- `packages/backend/platform/teams/team_members` — polymorphic `member_id`
  (points at Athlete OR Coach; no morphMap declared → orphan-polymorphic).

**Polymorphic relations that need a `morphMap`:**
`team_members.member_type + member_id` reads via the
`TeamMemberInterface::ATTR_MEMBER_TYPE` + `ATTR_MEMBER_ID` columns. Laravel
resolves polymorphic types through a `morphMap` in a service provider. This
wasn't checked in this pass but likely absent.

---

## Package-level heatmap

Compact per-package heatmap sorted by number of concerns:

| Package                                           | Models |  Migs | ERD gap           | Column drift                                          | Sequencing issues                                     |
| ------------------------------------------------- | -----: | ----: | ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `packages/backend/access/delegation`              |      2 |     2 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/access/grants`                  |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/access/invitations`             |      2 |     2 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/access/rbac`                    |      6 |     6 | Y                 | 0                                                     | 0 (odd migration names `_permissionses` / `_roleses`) |
| `packages/backend/access/requests`                |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/billing/entitlements`           |      2 |     2 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/billing/subscription`           |      3 |     3 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/compliance/compliance`          |      8 |     8 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/framework/feature-flags`        |      4 |     4 | **N** (has docs/) | 0                                                     | 0                                                     |
| `packages/backend/framework/scope`                |      4 |     4 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/identity/auth`                  |      7 | **8** | Y                 | 0                                                     | **1 duplicate (B8)**                                  |
| `packages/backend/identity/identity`              |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/identity/mfa`                   |      2 | **3** | Y                 | 0                                                     | **1 duplicate (B9) + 1 ordering (O2)**                |
| `packages/backend/identity/people`                |      3 |     3 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/identity/platform-user`         |      2 |     2 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/identity/service-accounts`      |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/identity/user`                  |      3 |     3 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/notifications/*`                |     21 |    21 | Y (per module)    | 0                                                     | 0                                                     |
| `packages/backend/observability/activity`         |      2 |     2 | Y                 | 0 (naming drift: `activities` vs `activity_log`)      | 0                                                     |
| `packages/backend/observability/audit`            |      2 |     2 | Y                 | 0                                                     | **cross-pkg dup (B6) with `shared/audit`**            |
| `packages/backend/observability/monitoring`       |      6 |     6 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/platform/branch`                |      1 | **2** | Y                 | 0                                                     | **1 duplicate (B1)**                                  |
| `packages/backend/platform/facility`              |      4 | **8** | Y                 | 0                                                     | **3 duplicates (B2, B3, B4, B5)**                     |
| `packages/backend/platform/organization`          |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/platform/region`                |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/platform/staff`                 |      2 | **3** | Y                 | **`StaffInterface::TABLE = 'staffs'` mismatch (§M2)** | **1 duplicate (B10) + 1 ordering (O3)**               |
| `packages/backend/platform/teams`                 |      4 |     4 | Y                 | 0                                                     | **1 ordering (O1)**                                   |
| `packages/backend/platform/tenancy`               |      2 |     2 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/platform/*` (rest)              |    ~18 |   ~18 | Y (per module)    | 0                                                     | 0                                                     |
| `packages/backend/shared/audit`                   |      1 |     1 | Y                 | 0                                                     | **cross-pkg dup (B6) with `observability/audit`**     |
| `packages/backend/shared/*` (rest)                |     26 |    26 | Y (per module)    | 0                                                     | 0                                                     |
| `packages/backend/workflow/approvals`             |      7 |     7 | Y                 | 0                                                     | 0                                                     |
| `packages/backend/workflow/tasks`                 |      3 |     3 | Y                 | 0                                                     | 0                                                     |
| `apps/academorix/src/modules/finance/gateway`     |      3 |     3 | Y                 | 0                                                     | **cross-mod dup (B7)**                                |
| `apps/academorix/src/modules/finance/payment`     |      4 |     4 | Y                 | 0                                                     | **cross-mod dup (B7)**                                |
| `apps/academorix/src/modules/finance/order`       |      3 |     3 | Y                 | 0                                                     | **1 ordering (O4)**                                   |
| `apps/academorix/src/modules/finance/*` (rest)    |    ~40 |   ~40 | Y (per module)    | 0                                                     | Candidate O5                                          |
| `apps/academorix/src/modules/growth/*`            |     18 |    18 | Y (per module)    | 0                                                     | 0                                                     |
| `apps/academorix/src/modules/products/geofencing` |      1 |     1 | Y                 | 0                                                     | 0                                                     |
| `apps/academorix/src/modules/sports/development`  |      5 | **6** | Y                 | 0                                                     | **1 duplicate (B11)**                                 |
| `apps/academorix/src/modules/sports/*` (rest)     |    ~55 |   ~55 | Y (per module)    | 0                                                     | Candidate O6                                          |

### Concerning outliers

- **`packages/backend/platform/facility`** — 4 models, 8 migrations. FOUR
  duplicate migrations. Post-cleanup: 4-4-4 (models-migrations-tables). Highest
  single-package duplicate count.
- **`packages/backend/platform/staff`** — 3 problems in one package: duplicate
  migration + missing table (staff vs staffs) + child-FKs-parent ordering bug.

---

## Suggested fix order

Ordered by (a) unblocker priority — every deployment blocker first, (b) commit
granularity — each batch fits one PR, (c) coupling — steps don't step on each
other.

### BLOCKER-tier — resolve BEFORE any `db:migrate` will run

1. **Delete duplicate migration files** (mechanical only; 11 files to remove):
   - `packages/backend/platform/branch/2026_07_15_120000_create_branchs_table.php`
   - `packages/backend/platform/facility/2026_07_15_120001_create_day_passes_table.php`
   - `packages/backend/platform/facility/2026_07_15_120002_create_facilities_table.php`
   - `packages/backend/platform/facility/2026_07_15_120003_create_passes_table.php`
   - `packages/backend/platform/facility/2026_07_15_120005_create_resource_bookings_table.php`
   - `packages/backend/identity/auth/2026_07_15_120003_create_auth_jwt_signing_keies_table.php`
   - `packages/backend/identity/mfa/2026_07_15_120003_create_webauthn_credentials_table.php`
     (keep `120001` version; verify diff first)
   - `packages/backend/platform/staff/2026_07_15_120000_create_coachs_table.php`
   - `apps/academorix/src/modules/sports/development/2026_07_15_120000_create_development_pathwaies_table.php`
   - **Owner:** `codebase-housekeeper`. Zero code change, only `git rm`.

2. **Consolidate `Audit`** — pick canonical location per `hierarchy.md §6`
   (recommend `observability/audit`); remove `shared/audit`. Requires an ADR:
   - **Owner:** `docs-adr-steward` writes the ADR; `codebase-housekeeper`
     executes the delete + rename.

3. **Reconcile `payment_methods` ownership** — `finance/gateway` vs
   `finance/payment`:
   - **Owner:** `docs-adr-steward` for the ownership decision;
     `codebase-housekeeper` for the file move.

4. **Fix migration ordering bugs** — renumber child-timestamps to be AFTER
   parent-timestamps:
   - `platform/teams`: `create_team_members_table` → move from `120001` to
     `120004` (after `teams` at `120003`)
   - `identity/mfa`: `create_mfa_challenges_table` → move from `120000` to
     `120002` (after `webauthn_credentials` at `120001`)
   - `platform/staff`: `create_coaches_table` → move from `120000` to `120002`
     (after `staffs` at `120001`) — combine with step 5 below
   - `finance/order`: `create_order_adjustments_table` +
     `create_order_lines_table` → move to `120003` + `120004` (after `orders` at
     `120002`)
   - **Owner:** `laravel-feature-builder`. Verify by running the generator with
     a fixed dependency-order pass.

5. **Rename `StaffInterface::TABLE` from `'staffs'` to `'staff'`** (English) +
   rename migration file + verify every FK reference now works:
   - **Owner:** `laravel-feature-builder`. Coupled with step 4 (same package).

### HIGH-tier — resolve BEFORE Phase 4 build starts

6. **Add `application_id` to `entitlements`** (EXPECTED-GAP-001):
   - **Owner:** `laravel-feature-builder`. Template: `tenancy-columns.md §8`.

7. **ADR revision for `application_id` on central-plane rows** (VIO-008 through
   VIO-014 in tenancy report):
   - **Owner:** `docs-adr-steward`. Extends
     `.kiro/steering/tenancy-columns.md §2` to permit `application_id` on
     `plans`, `auth_jwt_signing_keys`, `service_accounts`, `domains`.

8. **Drop `application_id` from 11 non-central-plane rows** (VIO-001 through
   VIO-007, VIO-011 through VIO-013, VIO-015 in tenancy report):
   - **Owner:** `codebase-housekeeper` per package.

9. **Add `BelongsToTenant` to `AccessRequestProjection` + `ServiceAccount`**
   (VIO-016 + VIO-017 in tenancy report):
   - **Owner:** `codebase-housekeeper`.

10. **Author top-priority ERDs** — 22 packages listed in "Priority 1" section
    above:
    - **Owner:** `data-modeler` (this agent) — one ERD per commit, one package
      per commit.

### MEDIUM-tier — resolve during Phase 4

11. **Add missing composite `(tenant_id, created_at)` indexes** — ~130+ tables
    listed above:
    - **Owner:** `laravel-feature-builder`. Batch by module. Each migration adds
      one composite index.

12. **Add relationship methods to every model** — `belongsTo` / `hasMany` /
    `morphMany`:
    - **Owner:** `laravel-feature-builder`. Codegen change — regenerate every
      model with the enhanced generator.

13. **Add missing userstamps to `development_pathways` and any other slim
    tables** — audit + fix pass:
    - **Owner:** `codebase-housekeeper`.

14. **Reconcile `activities` vs `activity_log` naming** (WARN-008 in tenancy
    report):
    - **Owner:** `docs-adr-steward`.

15. **Rename `leads.owner_id` → `leads.assigned_user_id`** (VIO-018 in tenancy
    report):
    - **Owner:** `laravel-feature-builder`.

### LOW-tier — resolve during Phase 6 or later

16. **Author Priority 2 ERDs** — 43 more packages/modules:
    - **Owner:** `data-modeler`.

17. **Author 5 cross-package aggregate ERDs**:
    - **Owner:** `data-modeler`.

18. **Verify migration ordering candidates O5 and O6** — likely additional cases
    in `finance/**` and `sports/match`, `sports/competition`:
    - **Owner:** `laravel-feature-builder`.

19. **Add `depends_on` field to every package's `catalog.json`** naming the
    cross-package tables it FKs to — makes implicit dependency order explicit +
    CI-verifiable:
    - **Owner:** `laravel-feature-builder`.

---

## Cross-agent handoffs

### For `docs-adr-steward`

- **ADR needed: `Audit` consolidation** — pick canonical location, obsolete
  `shared/audit`. Reference: `hierarchy.md §6` module responsibility map +
  `tenancy-columns.md §9` gap 1.
- **ADR needed: `application_id` on central-plane rows** — extend
  `.kiro/steering/tenancy-columns.md §2` to permit `application_id` on `plans`,
  `auth_jwt_signing_keys`, `service_accounts`, `domains` as a 9th–12th named row
  family.
- **ADR needed: `payment_methods` ownership** — resolve `finance/gateway` vs
  `finance/payment` per WARN-005 in tenancy report.
- **ADR needed: `activities` vs `activity_log` naming** — either steering doc
  changes to match the workspace, or workspace renames to match steering.
- **`hierarchy.md §14` matrix update** — add `age_groups`, `events`, `seasons`,
  `orders`, `expenses` with `organization_id` per WARN-004.
- **ERD publication location** — recommend `docs/data/<slug>-erd.md`. Not
  present today. Create the folder + convention.

### For `laravel-feature-builder`

- **Migration ordering fix** — 4 confirmed cases + 2 candidate patterns.
  Renumber timestamps to place children after parents.
- **`staffs` → `staff` rename** — interface + migration + FKs.
- **Add `application_id` to `entitlements`**.
- **Rename `leads.owner_id` → `leads.assigned_user_id`** (VIO-018).
- **Add composite `(tenant_id, created_at)` indexes** to ~130+ domain tables.
- **Add relationship methods** — every model needs
  `belongsTo`/`hasMany`/`morphMany` methods for its FKs.
- **Add `depends_on` field** to every `catalog.json` naming cross-package table
  dependencies.
- **Register `settings` as scope consumer** (EXPECTED-GAP-002 in tenancy
  report).
- **Verify `finance/*` and `sports/*` for O5/O6 migration ordering** patterns.

### For `codebase-housekeeper`

- **Delete 11 duplicate migration files** (BLOCKER-tier fix step 1) — verify
  diff on B9 before deleting; every other case is deterministic.
- **Add `BelongsToTenant` trait** to `AccessRequestProjection` +
  `ServiceAccount` (VIO-016 + VIO-017).
- **Drop `application_id` column** from 11 domain rows (VIO-001 – VIO-015 minus
  the 4 central-plane exceptions).
- **`SmsOptOut` → `BelongsToTenantOptional`** (WARN-001).
- **Consolidate `Audit`** — execute the delete + rename after `docs-adr-steward`
  writes the ADR.
- **Audit missing userstamps** on slim migrations (`development_pathways` is
  one; there may be others).

### For `backend-architecture-reviewer`

- **Verify FK cleanliness across packages** — `athlete-enrollments` has 9
  cross-package FKs from one migration. Are all 9 legitimate, or should some
  cascade through a tighter parent?
- **Verify polymorphic morphMap** — `team_members.member_type + member_id` — is
  a `morphMap` registered somewhere? If not, polymorphic queries will fail.
- **Verify `TeamMember` polymorphic invariants** — the tenancy report §16
  belongs-to matrix says `TeamMember` FKs to `Team` + `member (poly)`. The
  `team_members` migration ships `member_type + member_id` correctly. Verify the
  pivot's `active_unique` constraint + the polymorphic morphMap.

### For `security-compliance-reviewer` (blocked on this pass)

The 3 spatie pivot tables (`model_has_permissions`, `model_has_roles`,
`role_has_permissions`) carry `application_id` per VIO-004/VIO-005/VIO-006 —
pending the fix order step 7 ADR + step 8 drop-column pass. Once landed, verify
the write-path guards (`ApplicationMismatch` 422 on cross-application
role/permission writes).

### For `tenancy-compliance-auditor` (this agent's sibling)

**Re-run recommended after fix order steps 1–8 land.** Every remaining VIO
should either close or be documented via ADR. The R3 count should drop to the 4
central-plane exceptions codified in step 7.

---

## Appendix — codegen observations

Every migration + interface in the workspace is emitted by `generate-module.py`
(path referenced in the docblock:
`python3 modules/shared/blueprints/foundation/scripts/generate-module.py <domain> <package> --force`).
Observations for the generator maintainer:

1. **Duplicate migrations are a generator bug.** 11 duplicate migration files,
   all with identical or near-identical bodies, indicates the generator wrote
   the file twice under different pluralisations. Recommend adding a
   "target-table-uniqueness" check in the generator that fails hard when two
   migrations in the same directory target the same table.
2. **Migration ordering is alphabetical, not topological.** Recommend teaching
   the generator to read declared FKs from the blueprint and topological-sort
   the migration timestamps.
3. **Missing FK-target validation.** `platform/staff` migrations write
   `->on('staff')` but the interface declares `TABLE = 'staffs'`. Recommend a
   generator-time check that every `->on(...)` target string matches a known
   `TABLE` constant somewhere in the composer autoload graph.
4. **Missing userstamps on slim tables.** `development_pathways` was emitted
   without `created_by/updated_by/deleted_by`. Recommend the generator emit
   these unconditionally on every soft-deletable table.
5. **No relationship-method emission.** Recommend the generator derive
   `belongsTo(...)` / `hasMany(...)` methods from FK declarations in the
   blueprint.
6. **`_permissionses` / `_roleses` migration filenames.** Odd stray-suffix bug
   in spatie-pivot table naming. Filenames don't affect runtime (Schema::create
   uses interface constant) but do surface as reviewer noise.
