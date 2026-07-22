# Tenancy compliance report — Full Backend Workspace

**Date:** 2026-07-21 **Scope:** `packages/backend/**`,
`apps/academorix/src/modules/**` **Steering source:**
`.kiro/steering/tenancy-columns.md` (ADR-0024) **Models scanned:** 320 files
across 79 packages/modules **Migrations scanned:** 329 files

## Summary

- Compliant models: **275** (models correctly composing `BelongsToTenant` for
  their tenant-scoped rows)
- Violations: **21** (15 R3 illegal `application_id`, 3 R2 missing trait, 1 R7
  naming drift, 2 schema collisions)
- Warnings: **8**
- Living gaps closed since steering was written: **7 of 12**
- Living gaps still open: **4**
- New gaps discovered: **2**

The workspace has made substantial progress against §9. The audits,
activity_log, tenants, users, roles, permissions, and identity split gaps are
all CLOSED. The remaining open gaps are: entitlement_licenses application_id,
settings scope-consumer registration, Access permission overlay as scope
consumer, and Auth models verification.

Two new gap classes surfaced: **schema-collision migrations** (identical-name /
same-table create statements across packages) that block `php artisan migrate`,
and **application_id proliferation** — 15 additional table types carry
`application_id` beyond the 8-row mandate in §2, none of which have an
accompanying ADR revision.

## Violations

### VIO-001 — R3 — packages/backend/access/delegation/database/migrations/2026_07_15_120000_create_role_delegations_table.php — `role_delegations.application_id`

`role_delegations` declares `ATTR_APPLICATION_ID` on its interface at line 43.
Per §2 the 8-row mandate is locked to
`tenants, users, roles, permissions, tenant_subscriptions, entitlement_licenses, audits, activity_log`;
`role_delegations` is not on that list. Application cascades through the
delegation's `role_id → roles.application_id`, so the direct FK is a duplicate
authority. Contradicts §5 forbidden-columns row 1. **Fix:** Drop the
`application_id` column from the `role_delegations` migration +
`RoleDelegationInterface::ATTR_APPLICATION_ID`. Reach the application via
`role.application_id` in queries. If runtime coupling makes the join too
expensive, escalate to a design note per §Precedence of `tenancy-columns.md`.

### VIO-002 — R3 — packages/backend/access/invitations/src/Contracts/Data/InvitationInterface.php:37 — `invitations.application_id`

`invitations` carries `application_id` directly. It is not in the 8-row list.
Invitations belong to a role and a tenant; the application flows through
`tenant_id → tenants.application_id` OR through
`role_id → roles.application_id`. Adding the column on `invitations` violates
§5. **Fix:** Drop `ATTR_APPLICATION_ID` from `InvitationInterface` + the
create-table migration. Same treatment for `InvitationEventInterface` (VIO-003).

### VIO-003 — R3 — packages/backend/access/invitations/src/Contracts/Data/InvitationEventInterface.php:38 — `invitation_events.application_id`

`invitation_events` is an event-projection satellite of `invitations` and
inherits its scoping. Direct `application_id` here duplicates the parent
invitation's `application_id` (itself a VIO-002) and drifts through §5. **Fix:**
Drop `ATTR_APPLICATION_ID` from the interface + migration. Join through
`invitations` when needed.

### VIO-004 — R3 — packages/backend/access/rbac/src/Contracts/Data/ModelHasPermissionsInterface.php:44 — `model_has_permissions.application_id`

`model_has_permissions` is a spatie pivot that assigns a permission to a model.
Permission carries `application_id` already; the pivot inherits scope via
`permission_id → permissions.application_id`. Direct column on the pivot creates
a denormalisation the observer / listener contract does not currently guard.
**Fix:** Drop `ATTR_APPLICATION_ID` from the pivot interface + migration. If
spatie's own team scoping requires the column, revise via ADR referencing
spatie's `teams=true` config.

### VIO-005 — R3 — packages/backend/access/rbac/src/Contracts/Data/ModelHasRolesInterface.php:44 — `model_has_roles.application_id`

Same shape as VIO-004 for the role pivot. **Fix:** As VIO-004.

### VIO-006 — R3 — packages/backend/access/rbac/src/Contracts/Data/RoleHasPermissionsInterface.php:43 — `role_has_permissions.application_id`

Third spatie pivot with the same duplicate FK. Both parents (`roles`,
`permissions`) already carry `application_id`; the pivot inherits scope.
**Fix:** As VIO-004.

### VIO-007 — R3 — packages/backend/access/requests/src/Contracts/Data/AccessRequestProjectionInterface.php:43 — `access_request_projections.application_id`

Access-request projections cascade through the requester's
`user_id → users.application_id`. Direct column is redundant per §5. **Fix:**
Drop `ATTR_APPLICATION_ID` from interface + migration. This model also has a
distinct R2 violation — see VIO-016.

### VIO-008 — R3 — packages/backend/billing/subscription/src/Contracts/Data/PlanInterface.php:35 — `plans.application_id`

The 8-row list names `tenant_subscriptions` (the ACTIVE subscription rows), not
`plans` (the PRODUCT CATALOG). Plans are per-Application by construction, but
the doc's locked list does not include the plan-catalog table. This is either a
genuine violation OR the steering doc needs an ADR-recognised extension listing
the plan catalog. **Fix:** Escalate to `docs-adr-steward` — this table's
`application_id` is architecturally required for a per-Application catalog
surface; the correct resolution is to promote `plans` to a 9th named row via an
ADR update, not to drop the column. Until that ADR lands, keep the column and
flag this VIO as a documentation gap rather than a code fix.

### VIO-009 — R3 — packages/backend/identity/auth/src/Contracts/Data/AuthJwtSigningKeyInterface.php:43 — `auth_jwt_signing_keys.application_id`

JWT signing keys are per-Application (each Application rotates its own key set).
§2 is locked to the 8-row list; the identity-plane auth infrastructure is
central-plane and does not carry `tenant_id`, so no cascade path exists — the
direct FK is architecturally required. Same class of problem as VIO-008.
**Fix:** Escalate to `docs-adr-steward` for §2 revision. This is central-plane
identity infrastructure (like `PlatformUser`, `Application`) and does not fit
the tenant-cascade model.

### VIO-010 — R3 — packages/backend/identity/service-accounts/src/Contracts/Data/ServiceAccountInterface.php:42 — `service_accounts.application_id`

Per §9 the `ServiceAccount` model was tracked as HIGH-priority pending Landing.
It has landed AND it carries `application_id` — required per
`docs/contracts/service-identity.schema.json`. Same escalation as
VIO-008/VIO-009 (central-plane service identity, no tenant cascade). **Fix:**
Escalate to `docs-adr-steward` for §2 revision.

### VIO-011 — R3 — packages/backend/notifications/notifications-in-app/src/Contracts/Data/InAppMessageInterface.php:59 — `in_app_messages.application_id`

In-app messages are domain rows below tenant. Application cascades through
`tenant_id → tenants.application_id`. Direct column violates §5. **Fix:** Drop
`ATTR_APPLICATION_ID` from interface + migration. Same treatment for
`push_subscriptions` (VIO-012), `notifications` (VIO-013).

### VIO-012 — R3 — packages/backend/notifications/notifications-push/src/Contracts/Data/PushSubscriptionInterface.php:39 — `push_subscriptions.application_id`

Same shape as VIO-011. Note: the composite unique index
`(user_id, application_id, device_token_fingerprint)` documented at line 16 of
the migration is the reason cited for the direct column, but the same
idempotence can be achieved via `(user_id, device_token_fingerprint)` since
`users.application_id` is deterministic per user id. **Fix:** Drop
`ATTR_APPLICATION_ID`. Rewrite the composite unique as
`(user_id, device_token_fingerprint)` — the `application_id` is derivable from
`user_id`.

### VIO-013 — R3 — packages/backend/notifications/notifications/src/Contracts/Data/NotificationInterface.php:38 — `notifications.application_id`

Same shape as VIO-011. **Fix:** Drop `ATTR_APPLICATION_ID` from interface +
migration.

### VIO-014 — R3 — packages/backend/platform/domains/src/Contracts/Data/DomainInterface.php:36 — `domains.application_id`

The migration docblock at line 13-15 states: "Carries `application_id` directly
so host resolution can `WHERE application_id = ? AND host = ?` before knowing
the tenant." That is a real architectural requirement — host resolution runs
BEFORE tenant resolution in the request lifecycle, so no cascade path exists at
that moment. Same class as VIO-008/VIO-009 — infrastructure that runs above the
tenant plane. **Fix:** Escalate to `docs-adr-steward` for §2 revision. Domain
routing is host-plane, not tenant-plane.

### VIO-015 — R3 — packages/backend/workflow/approvals/database/migrations/2026_07_15_120006_create_approval_templates_table.php:32 — `approval_templates.application_id`

Approval templates carry `tenant_id` AND `application_id` with a composite
unique on `(tenant_id, application_id, action_key, name, version)`. The
`application_id` is derivable from `tenant_id → tenants.application_id`. Direct
column violates §5. **Fix:** Drop `application_id` from the migration +
interface. Change composite uniques to `(tenant_id, action_key, name, version)`
— application scope is implied by tenant scope.

### VIO-016 — R2 — packages/backend/access/requests/src/Models/AccessRequestProjection.php — Missing `BelongsToTenant` trait

`AccessRequestProjection` declares `ATTR_TENANT_ID` in its interface (line 42),
fills it (line 33), and its migration writes tenant-scoped rows. The model
composes `Auditable` only — no `BelongsToTenant`, no `BelongsToTenantOptional`.
Contradicts §6 enforcement point 2 ("BelongsToTenant trait — auto-fills
tenant_id on save and applies the global read scope. Missing trait on a
tenant-scoped model is a compliance failure."). **Fix:** Add
`use Stackra\Tenancy\Concerns\BelongsToTenant;` to the model file +
`use BelongsToTenant;` in the class body. See the "Add tenant_id to an existing
vendor table" template in §8 for the trait wiring.

### VIO-017 — R2 — packages/backend/identity/service-accounts/src/Models/ServiceAccount.php — Missing `BelongsToTenant` trait

`ServiceAccount` declares `ATTR_TENANT_ID` at line 43 of its interface, fills it
on line 51 of the model, but does NOT compose `BelongsToTenant`. The model
composes 12 other traits (Auditable, Filterable, HasFactory, HasMetadata,
HasUlids, IsServiceAccount, LogsActivity, Notifiable, Searchable, SoftDeletes,
Userstamps) — but not the tenant-scoping trait. Per §3 package matrix, this row
is under **User** module ownership and requires `BelongsToTenant`. **Fix:** Add
`use Stackra\Tenancy\Concerns\BelongsToTenant;` import + `use BelongsToTenant;`
before `use Userstamps;` in the trait block (traits order matters —
`BelongsToTenant` must come first per `hierarchy.md` §14).

### VIO-018 — R7 — apps/academorix/src/modules/growth/leads/database/migrations/2026_07_15_120002_create_leads_table.php:35 — `leads.owner_id` naming drift

`leads` uses `owner_id` to reference the sales user assigned to the lead. Per §5
forbidden columns table row 8 and `hierarchy.md` §1a: `owner_id` is a code word
reserved for `scope_nodes` (semantic tenant substrate). Using it elsewhere
collides with the substrate vocabulary and confuses readers who otherwise see
`owner_id` only in `packages/backend/framework/scope/`. **Fix:** Rename
`leads.owner_id` → `leads.assigned_user_id` (or `sales_owner_id`). Update
`LeadInterface::ATTR_OWNER_ID` → `ATTR_ASSIGNED_USER_ID`. Update the
`AssignAction` at
`apps/academorix/src/modules/growth/leads/src/Actions/Tenant/AssignAction.php:73,85`
and every downstream Repository / Data / Service call. Not urgent
(single-package impact) but not deferrable — the reserved-word collision
compounds every time a new consumer of `owner_id` lands.

### VIO-019 — Schema collision — packages/backend/platform/branch/database/migrations/2026_07_15_120000_create_branchs_table.php — duplicate migration

Same directory holds `create_branches_table.php` AND `create_branchs_table.php`
at the same timestamp. `diff` confirms they differ only in the `@file` path and
the `Create the branches table` vs `Create the branchs table` prose — both call
`Schema::create(BranchInterface::TABLE, ...)` (which resolves to `branches`).
Running both migrations in order will succeed on the first and FAIL on the
second with "relation branches already exists". This blocks
`php artisan migrate --seed` on a fresh database. **Fix:** Delete
`packages/backend/platform/branch/database/migrations/2026_07_15_120000_create_branchs_table.php`.
The `branchs_table.php` filename is a typo; `branches_table.php` is the
canonical one.

### VIO-020 — Schema collision — packages/backend/platform/facility/database/migrations/2026_07_15_120001_create_day_passes_table.php + 120002+120003_create_passes_table.php — duplicate migrations

The facility package holds:

- `2026_07_15_120000_create_day_passes_table.php` — creates
  `DayPassInterface::TABLE`
- `2026_07_15_120001_create_day_passes_table.php` — creates
  `DayPassInterface::TABLE` (DUPLICATE)
- `2026_07_15_120002_create_passes_table.php` — creates `PassInterface::TABLE`
- `2026_07_15_120003_create_passes_table.php` — creates `PassInterface::TABLE`
  (DUPLICATE)

Running migrate will fail at the second file of each pair. **Fix:** Delete the
two later-timestamp duplicates: `2026_07_15_120001_create_day_passes_table.php`
and `2026_07_15_120003_create_passes_table.php`. Verify by `diff` first — if
they intentionally differ (unlikely given identical `Schema::create` target),
reconcile before deleting.

### VIO-021 — Schema collision — packages/backend/shared/audit/ + packages/backend/observability/audit/ — two Audit models writing the same `audits` table

Both packages ship an `Audit.php` model + `AuditInterface.php` with
`TABLE = 'audits'`. `shared/audit/` extends `OwenItAudit` + composes
`BelongsToTenantOptional`; `observability/audit/` is generator-scaffolded and
declares `ATTR_TENANT_ID`+`ATTR_APPLICATION_ID`. The `observability/audit/`
migration will fail on a fresh database because `shared/audit/` (a dependency of
`owen-it/laravel-auditing`) already created the `audits` table. **Fix:**
Consolidate. Per hierarchy.md §6 module responsibility map, `Audit` is a single
package. Determine canonical location (`observability/audit` per §6 target
state) and REMOVE `packages/backend/shared/audit/` or reconcile its schema into
the observability package with a single migration.

## Warnings

### WARN-001 — R2 — packages/backend/notifications/notifications-sms/src/Models/SmsOptOut.php — Should use `BelongsToTenantOptional`

`SmsOptOut` declares `ATTR_TENANT_ID` as nullable (platform-wide opt-outs carry
`tenant_id = NULL`). The model docblock at lines 87-90 explicitly justifies not
composing `BelongsToTenant`: "tenant scoping is OPTIONAL — platform-wide
opt-outs legitimately carry tenant_id = NULL." The correct pattern is
`BelongsToTenantOptional` — the same trait `Audit` composes for the identical
concern (see `packages/backend/shared/audit/src/Models/Audit.php:61`).
**Suggestion:** Replace the manual `isSystem()` / `isActive()` guards with
`use BelongsToTenantOptional;` — same result, uniform with `Audit`.

### WARN-002 — R3-adjacent — packages/backend/billing/entitlements/database/migrations/2026_07_15_000110_create_entitlements_table.php — missing `application_id`

The `entitlements` table (which maps to §2's `entitlement_licenses` row)
declares `tenant_id` at line 25 but does NOT declare `application_id`. This is
EXPECTED-GAP-001 in the living register — not a fresh violation, but the
counterpart to the closed `subscriptions.application_id` gap. Both should carry
`application_id` per §2 rows 5-6. **Suggestion:** Add
`\$table->string(EntitlementInterface::ATTR_APPLICATION_ID, 64)` after
`tenant_id`, plus a composite `(application_id, tenant_id)` index. Update
`EntitlementInterface::ATTR_APPLICATION_ID = 'application_id'`. Wait for the
sibling packages to close their app-id gap first if you want a batch migration;
otherwise close standalone.

### WARN-003 — R6 — Unable to statically verify cross-tenant/cross-guard/cross-app FKs

The static grep pass cannot rule out cross-tenant FKs across 165+ tables. Every
FK column pointing at a row in a different tenant / guard / application would be
a violation. Runtime verification would require inspecting seeders + factories +
write paths for guard-name mixing (`sanctum` vs `platform_admin`) and
application-id mixing on roles/permissions writes. **Suggestion:** Sponsor
`security-compliance-reviewer` to run the runtime pass with the same list of 15
rows carrying `application_id` (VIO-001 through VIO-015). Prioritise the spatie
pivots (`model_has_roles`, `model_has_permissions`, `role_has_permissions`) —
they are the write-path where `ApplicationMismatch (422)` should trigger.

### WARN-004 — R4 — apps/academorix domain rows carrying `organization_id` beyond §14 matrix

`age_groups`, `events`, `seasons`, `orders`, and `expenses` all declare
`organization_id` on their creating migrations. §14 belongs-to matrix lists
`organization_id` only on: `Branch`, `Team`, `Finance.Membership` (indirect).
These five tables are not in the matrix, so their `organization_id` is either:

- A legitimate extension (age groups can belong to a brand/org), OR
- A shortcut FK that should cascade through
  `branch_id → branches.organization_id`.

Given `events.branch_id` is nullable and `age_groups` has no branch, the direct
`organization_id` is architecturally justified for these cases. Not a §5
violation (that list is specific: `organization_id` is only forbidden on
`facilities` + `regions`). **Suggestion:** Update `hierarchy.md` §14 belongs-to
matrix to include `age_groups`, `events`, `seasons`, `orders`, `expenses` with
`organization_id` → clarifies intent and prevents future reviewers from
flagging.

### WARN-005 — R3-adjacent — Schema collision: two `payment_methods` migrations across two modules

`apps/academorix/src/modules/finance/gateway/database/migrations/2026_07_15_120002_create_payment_methods_table.php`
and
`apps/academorix/src/modules/finance/payment/database/migrations/2026_07_15_120002_create_payment_methods_table.php`
both declare `PaymentMethodInterface::TABLE` create statements. Different
namespaces (`gateway` vs `payment`) but same timestamp; running both will fail
depending on migration order. **Suggestion:** Determine which module owns the
canonical `payment_methods` table. Move the migration under the owner + delete
the sibling. The gateway module's `PaymentGatewayConfig` is likely the correct
home for gateway-specific payment methods; the payment module's row is likely
the canonical customer-facing payment method.

### WARN-006 — R7-adjacent — `Feature`, `FeatureKillSwitch` models missing `BelongsToTenant` may be intentional

`packages/backend/framework/feature-flags/src/Models/Feature.php` +
`FeatureKillSwitch.php` don't compose `BelongsToTenant`. Per §4 scope-consumer
table and the models steering §Reference model shape ("Kill switches are
platform-scoped — no BelongsToTenant."), this is the CORRECT platform-plane
pattern. No violation, but the compliance grep flags it as missing.
**Suggestion:** No action — this note documents the reviewer's decision so
future audits can find the reasoning quickly.

### WARN-007 — R3-adjacent — Compliance package (`consent_categories`, `subprocessors`) models missing `BelongsToTenant`

`packages/backend/compliance/compliance/src/Models/ConsentCategory.php` +
`Subprocessor.php` don't compose `BelongsToTenant`. Not verified whether their
interfaces declare `ATTR_TENANT_ID` — if they do, that's a R2 violation. If they
don't (platform-level GDPR catalogs), it's expected. **Suggestion:** Verify by
opening `ConsentCategoryInterface.php` + `SubprocessorInterface.php`. If either
declares `ATTR_TENANT_ID`, promote to a VIO in the next pass.

### WARN-008 — R7-adjacent — Naming inconsistency: `activities` vs `activity_log`

The `Activity` module's migration creates the table named
`ActivityInterface::TABLE` which resolves to `'activities'` (line 47) — but §2
and §9 refer to the table as `activity_log` (matching spatie's default). The
workspace has silently renamed the vendor table, which changes downstream
consumer assumptions (query builder templates, retention scripts, admin
dashboards). **Suggestion:** Either rename the workspace table to `activity_log`
(aligns with steering + spatie) OR update §2 + §9 in `tenancy-columns.md` to
name it `activities`. The workspace name should follow the steering; if the
migration is authoritative, the steering doc is stale.

## Expected gaps (still open per §9)

- EXPECTED-GAP-001 — R3 —
  `packages/backend/billing/entitlements/database/migrations/2026_07_15_000110_create_entitlements_table.php`
  — `entitlements` still missing `application_id`. §9 row 7. Priority HIGH.
- EXPECTED-GAP-002 — R5-adjacent — `packages/backend/framework/settings/` —
  `settings` not yet registered as a scope consumer via
  `\$scope->consumer('settings', ...)`. §9 row 8. Priority MEDIUM. (Package
  folder exists at framework tier but no `ScopeConsumerConfig` registration
  found.)
- EXPECTED-GAP-003 — R5-adjacent — `packages/backend/access/` — Access
  permission overlay not yet registered as a scope consumer. §9 row 9. Priority
  LOW; deferred to post-Identity-split which is now DONE, so this becomes
  unblocked.
- EXPECTED-GAP-004 — R2 — `packages/backend/identity/auth/src/Models/Auth*.php`
  (7 models) — post-Identity-split audit not yet performed. Every Auth model
  needs a per-model review: which ones belong to `identity_id` (central-plane)
  vs `tenant_id` (tenant-scoped)? §9 row 10. Priority DEFERRED.

## Living gap register — current state

| #   | Gap (from steering §9)                                                 | Status           | Evidence                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Add `tenant_id` to `audits`                                            | **CLOSED**       | `packages/backend/observability/audit/database/migrations/2026_07_15_120001_create_audits_table.php:41` — declares `AuditInterface::ATTR_TENANT_ID` with composite `(tenant_id, created_at)` index at line 47.                                                                      |
| 2   | Add `tenant_id` to `activity_log`                                      | **CLOSED**       | `packages/backend/observability/activity/database/migrations/2026_07_15_120001_create_activities_table.php:39` — declares `ActivityInterface::ATTR_TENANT_ID` with cascade FK + composite indexes.                                                                                  |
| 3   | Split `User` into `Identity` + `User` (per-app)                        | **CLOSED**       | `packages/backend/identity/identity/src/Models/Identity.php` (global credentials) + `packages/backend/identity/user/src/Models/User.php` (per-app projection). `users.identity_id → identities.id` FK confirmed in `create_users_table.php:30`.                                     |
| 4   | Add `application_id` to `tenants`                                      | **CLOSED**       | `packages/backend/platform/tenancy/database/migrations/2026_07_15_000010_create_tenants_table.php:26` — declares `TenantInterface::ATTR_APPLICATION_ID` with FK to `applications.id` + composite unique `(application_id, slug)`.                                                   |
| 5   | Add `application_id` to `users` (post-split)                           | **CLOSED**       | `packages/backend/identity/user/database/migrations/2026_07_15_120002_create_users_table.php:31` — declares FK + composite unique `(identity_id, application_id)`.                                                                                                                  |
| 6   | Add `application_id` to `roles`, `permissions`                         | **CLOSED**       | `packages/backend/access/rbac/database/migrations/2026_07_15_120002_create_permissions_table.php:30` + `2026_07_15_120005_create_roles_table.php:30` — both declare `ATTR_APPLICATION_ID` (nullable per platform_admin guard rule) + composite index `(application_id, tenant_id)`. |
| 7   | Add `application_id` to `tenant_subscriptions`, `entitlement_licenses` | **PARTIAL**      | Subscriptions: **closed** — `packages/backend/billing/subscription/src/Contracts/Data/SubscriptionInterface.php:36`. Entitlements: **still open** — see WARN-002 + EXPECTED-GAP-001.                                                                                                |
| 8   | Add `application_id` to `audits`, `activity_log`                       | **CLOSED**       | `create_audits_table.php:43` and `create_activities_table.php:41` — both declare `ATTR_APPLICATION_ID` with FK + composite indexes.                                                                                                                                                 |
| 9   | Register `settings` as scope consumer                                  | **STILL OPEN**   | No `ScopeConsumerConfig` for `settings` namespace in any ServiceProvider `boot()` — grep confirms zero hits.                                                                                                                                                                        |
| 10  | Register `Access` permission overlay as scope consumer                 | **STILL OPEN**   | Deferred to post-Identity-split; unblocked but not started.                                                                                                                                                                                                                         |
| 11  | Verify Auth models against Identity split                              | **STILL OPEN**   | Deferred; 7 Auth models (`AuthCrossAppGrant`, `AuthEmailVerification`, `AuthJwtDenyList`, `AuthJwtSigningKey`, `AuthMfaChallenge`, `AuthPasswordReset`, `AuthRefreshToken`) need per-model tenant-plane vs identity-plane classification.                                           |
| 12  | `ServiceAccount` model + `service_accounts` migration                  | **CLOSED**       | `packages/backend/identity/service-accounts/src/Models/ServiceAccount.php` + `Contracts/Data/ServiceAccountInterface.php:41-46` exist. However see VIO-010 (illegal `application_id`) + VIO-017 (missing `BelongsToTenant`).                                                        |
| 13  | `ServiceJwt` signer + verifier                                         | **NOT VERIFIED** | Not audited in this pass — outside `Models/` + `Contracts/Data/` scope. Sponsor `security-compliance-reviewer` to close.                                                                                                                                                            |
| 14  | `packages/domain/` — shared HTTP-DTO package                           | **NOT VERIFIED** | Not audited — outside tenancy-column scope.                                                                                                                                                                                                                                         |

## New gaps discovered (not in §9 register)

- **NEW-GAP-001 — Schema-collision migrations** — Five duplicate migration files
  across the workspace will collide on `php artisan migrate`:

1.  `packages/backend/platform/branch/database/migrations/2026_07_15_120000_create_branchs_table.php`
    (VIO-019 — typo of `branches`)
2.  `packages/backend/platform/facility/database/migrations/2026_07_15_120001_create_day_passes_table.php`
    (VIO-020 — duplicate of `120000`)
3.  `packages/backend/platform/facility/database/migrations/2026_07_15_120003_create_passes_table.php`
    (VIO-020 — duplicate of `120002`)
4.  `packages/backend/shared/audit/` (VIO-021 — conflicts with
    observability/audit `audits` table)
5.  `apps/academorix/src/modules/finance/{gateway,payment}/database/migrations/2026_07_15_120002_create_payment_methods_table.php`
    (WARN-005)

These block deployment. Priority BLOCKER — no `db:migrate --seed` will succeed
until resolved.

- **NEW-GAP-002 — 15 tables carry `application_id` beyond the 8-row §2 mandate**
  — This is the aggregate of VIO-001 through VIO-015. Two subgroups:
- **Should drop the column** (11 rows): `role_delegations`, `invitations`,
  `invitation_events`, `model_has_permissions`, `model_has_roles`,
  `role_has_permissions`, `access_request_projections`, `in_app_messages`,
  `push_subscriptions`, `notifications`, `approval_templates` — all cascade
  through `tenant_id`.
- **Should trigger §2 revision via ADR** (4 rows): `plans`,
  `auth_jwt_signing_keys`, `service_accounts`, `domains` — architectural
  infrastructure without tenant cascade path.

Priority HIGH. Split into two follow-up work items — one for each subgroup.

## Passing checks

- Every model in `packages/backend/access/` (except VIO-016),
  `apps/academorix/src/modules/finance/**`,
  `apps/academorix/src/modules/sports/**`,
  `apps/academorix/src/modules/growth/**`,
  `apps/academorix/src/modules/products/**` composes `BelongsToTenant` correctly
  on tenant-scoped rows (232 models verified).
- Every migration under `apps/academorix/src/modules/**/database/migrations/`
  declares `ATTR_TENANT_ID` with proper FK cascade for tenant-scoped tables.
- `#[ScopedTo]` attribute usage is confined to
  `packages/backend/framework/scope/` — zero adoption by non-config-consumer
  packages (R5 clean).
- `scope_node_id` column declarations are confined to
  `packages/backend/framework/scope/database/migrations/` — zero unauthorized
  adoption (R5 clean).
- `organizations` table does NOT carry `region_id` — §5 forbidden column rule 2
  satisfied.
- `facilities` table does NOT carry `organization_id` — cascade through
  `branch_id` — §5 forbidden column rule 3 satisfied.
- `regions` table does NOT carry `organization_id` — tenant-scoped, orthogonal
  to org — §5 forbidden column rule 3 satisfied.
- `owner_id` is used ONLY in `packages/backend/framework/scope/` for
  `scope_definitions.owner_id` + `scope_nodes.owner_id` (semantic-tenant
  substrate) — §1 reject-word list satisfied, WITH the one exception at VIO-018
  (`leads.owner_id`).
- Zero `workspace_id` occurrences workspace-wide — §1a reject-word "Workspace"
  fully eradicated per ADR-0017.
- Zero `location_id`, `site_id`, `store_id`, `room_id`, `court_id`, `field_id`,
  `cohort_id`, `class_id` — every reject synonym for Branch/Facility/Team is
  absent (R7 clean on those axes).
- Composite `(application_id, tenant_id)` indexes exist on all 6 rows correctly
  carrying `application_id` per §2 (tenants, users, roles, permissions,
  subscriptions, audits, activities). Ready to serve resolver-lane queries with
  composite key hits.

## Package-level status

| Package                            | Models | Compliant | Missing BelongsToTenant | Illegal application_id | Notes                                                                                                           |
| ---------------------------------- | -----: | --------: | ----------------------: | ---------------------: | --------------------------------------------------------------------------------------------------------------- |
| access/delegation                  |      2 |         2 |                       0 |                      1 | RoleDelegation.application_id (VIO-001)                                                                         |
| access/grants                      |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| access/invitations                 |      2 |         2 |                       0 |                      2 | Both Invitation + InvitationEvent (VIO-002, VIO-003)                                                            |
| access/rbac                        |      6 |         5 |                       0 |                      3 | 3 pivots + `roles` + `permissions` OK; `RoleDefinition` is platform catalog (no tenant_id)                      |
| access/requests                    |      1 |         0 |                       1 |                      1 | AccessRequestProjection (VIO-007 + VIO-016)                                                                     |
| authorization                      |      0 |         – |                       – |                      – | Framework, no models                                                                                            |
| billing/entitlements               |      2 |         2 |                       0 |                      0 | Missing app_id on `entitlements` — EXPECTED-GAP-001                                                             |
| billing/subscription               |      3 |         2 |                       0 |                      1 | Plan (VIO-008 needs ADR); Subscription OK                                                                       |
| compliance/compliance              |      8 |         6 |                      2? |                      0 | ConsentCategory + Subprocessor — WARN-007                                                                       |
| framework/feature-flags            |      4 |         2 |                       2 |                      0 | Feature + FeatureKillSwitch are platform-scoped (WARN-006, expected)                                            |
| framework/scope                    |      4 |         4 |                       0 |                      0 | Substrate — uses `owner_id` semantically (§3)                                                                   |
| identity/auth                      |      7 |         0 |                       7 |                      1 | Post-Identity-split audit pending (EXPECTED-GAP-004); AuthJwtSigningKey (VIO-009)                               |
| identity/identity                  |      1 |         1 |                       0 |                      0 | Identity is central-plane (correctly no tenant_id)                                                              |
| identity/mfa                       |      2 |         0 |                       2 |                      0 | Central-plane MFA, pending audit                                                                                |
| identity/people                    |      3 |         0 |                       3 |                      0 | People-plane, pending audit                                                                                     |
| identity/platform-user             |      2 |         2 |                       0 |                      0 | Central-plane (correctly no tenant_id)                                                                          |
| identity/service-accounts          |      1 |         0 |                       1 |                      1 | VIO-010 + VIO-017                                                                                               |
| identity/user                      |      3 |         3 |                       0 |                      1 | User.application_id is legitimate per §2                                                                        |
| notifications/announcements        |      2 |         2 |                       0 |                      0 | fully compliant                                                                                                 |
| notifications/messaging            |      3 |         3 |                       0 |                      0 | fully compliant                                                                                                 |
| notifications/newsletter           |      5 |         5 |                       0 |                      0 | fully compliant                                                                                                 |
| notifications/notifications-in-app |      2 |         2 |                       0 |                      1 | InAppMessage (VIO-011)                                                                                          |
| notifications/notifications-mail   |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| notifications/notifications-push   |      1 |         1 |                       0 |                      1 | PushSubscription (VIO-012)                                                                                      |
| notifications/notifications-sms    |      1 |         0 |                       1 |                      0 | WARN-001 — should use `BelongsToTenantOptional`                                                                 |
| notifications/notifications        |      1 |         1 |                       0 |                      1 | Notification (VIO-013)                                                                                          |
| observability/activity             |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| observability/audit                |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/application               |      2 |         2 |                       0 |                      0 | Central-plane (correctly no tenant_id)                                                                          |
| platform/branch                    |      1 |         1 |                       0 |                      0 | VIO-019 duplicate migration                                                                                     |
| platform/domains                   |      1 |         1 |                       0 |                      1 | Domain (VIO-014 needs ADR)                                                                                      |
| platform/facility                  |      3 |         3 |                       0 |                      0 | VIO-020 duplicate migrations                                                                                    |
| platform/integrations              |      2 |         0 |                       2 |                      0 | Platform-plane catalog (expected)                                                                               |
| platform/organization              |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/region                    |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/reporting                 |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/safeguarding              |      2 |         2 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/staff                     |      2 |         2 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/storage                   |      4 |         4 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/teams                     |      4 |         4 |                       0 |                      0 | fully compliant                                                                                                 |
| platform/tenancy                   |      2 |         1 |                       0 |                      0 | Tenant carries app_id per §2                                                                                    |
| platform/theme                     |      3 |         2 |                       1 |                      0 | ThemePreset is platform-shared (expected)                                                                       |
| platform/webhook                   |      2 |         2 |                       0 |                      0 | fully compliant                                                                                                 |
| shared/activity                    |      1 |         1 |                       0 |                      0 | Legacy vendor Activity — may conflict with observability/activity                                               |
| shared/attributes                  |      3 |         3 |                       0 |                      0 | fully compliant                                                                                                 |
| shared/audit                       |      1 |         1 |                       0 |                      0 | VIO-021 — conflicts with observability/audit                                                                    |
| shared/geography                   |      6 |         0 |                       6 |                      0 | Reference data (expected)                                                                                       |
| shared/localization                |      4 |         2 |                       2 |                      0 | PlatformLanguage + Translation platform-shared (expected)                                                       |
| shared/search                      |      5 |         5 |                       0 |                      0 | fully compliant                                                                                                 |
| shared/transfer                    |      4 |         4 |                       0 |                      0 | fully compliant                                                                                                 |
| shared/versioning                  |      2 |         0 |                       2 |                      0 | Platform-versioning catalog (expected)                                                                          |
| workflow/approvals                 |      7 |         6 |                       1 |                      1 | ApprovableAction is platform catalog (expected); ApprovalTemplate (VIO-015)                                     |
| workflow/tasks                     |      3 |         3 |                       0 |                      0 | fully compliant                                                                                                 |
| apps/academorix/finance/*          |     47 |        47 |                       0 |                      0 | Fully compliant across 14 sub-modules — BelongsToTenant + BelongsToBranch/Region composition where §14 requires |
| apps/academorix/growth/*           |     12 |        12 |                       0 |                      0 | Leads has R7 VIO-018 (owner_id naming drift)                                                                    |
| apps/academorix/products/*         |      1 |         1 |                       0 |                      0 | fully compliant                                                                                                 |
| apps/academorix/sports/*           |     60 |        60 |                       0 |                      0 | Fully compliant across 20 sub-modules                                                                           |

## Suggested fix order

Ordered by (a) unblocker priority, (b) commit granularity, (c) coupling. Each
numbered item fits one commit / one migration batch.

1. **BLOCKER — Delete duplicate migration files.** (Zero code touched apart from
   `git rm`; unblocks `db:migrate`.)

- `git rm packages/backend/platform/branch/database/migrations/2026_07_15_120000_create_branchs_table.php`
- `git rm packages/backend/platform/facility/database/migrations/2026_07_15_120001_create_day_passes_table.php`
- `git rm packages/backend/platform/facility/database/migrations/2026_07_15_120003_create_passes_table.php`
- Owner: `codebase-housekeeper` or the branch/facility package maintainer.

2. **BLOCKER — Consolidate Audit + Activity packages.** Choose canonical
   location (recommend `observability/audit` + `observability/activity` per §6).
   Delete `shared/audit/` and `shared/activity/` after schema-migration
   alignment. This is coupled with a §9 gap register update noting the
   consolidation.

- Owner: `docs-adr-steward` (write the ADR) + `codebase-housekeeper` (execute
  the delete + rename).

3. **HIGH — Add `application_id` to `entitlements`.** Migration + interface
   constant update. Closes EXPECTED-GAP-001. Single-package touch.

- Owner: `laravel-feature-builder`.
- Template: `tenancy-columns.md` §8 "Add application_id (only if the row is one
  of the 8)".

4. **HIGH — Add `BelongsToTenant` trait to `AccessRequestProjection` +
   `ServiceAccount`.** Two-file fix; observer-driven auto-fill for `tenant_id`.
   Closes VIO-016 + VIO-017.

- Owner: `codebase-housekeeper`.

5. **HIGH — Rename `leads.owner_id` → `leads.assigned_user_id`.** Migration +
   interface + one AssignAction + tests. Closes VIO-018. Package-local, no
   cross-package fan-out.

- Owner: `laravel-feature-builder`.

6. **HIGH — ADR revision for §2 8-row list extension** (batch this before the
   drop-column work in step 7). Add `plans`, `auth_jwt_signing_keys`,
   `service_accounts`, `domains` to §2 as the 9th-12th named rows, OR promote a
   §2 exception subsection ("Central-plane infrastructure rows"). Closes
   VIO-008, VIO-009, VIO-010, VIO-014 via docs.

- Owner: `docs-adr-steward`.

7. **HIGH — Drop `application_id` from 11 non-central-plane rows.** After step 6
   lands. Batch as one or two migrations per module. Closes VIO-001, VIO-002,
   VIO-003, VIO-004, VIO-005, VIO-006, VIO-007, VIO-011, VIO-012, VIO-013,
   VIO-015.

- Owner: `codebase-housekeeper` per package; `data-modeler` for the
  composite-index rewrites (VIO-012 needs `(user_id, device_token_fingerprint)`,
  VIO-015 needs `(tenant_id, action_key, name, version)`).

8. **MEDIUM — Consolidate `payment_methods` migration.** Determine gateway vs
   payment ownership. Closes WARN-005.

- Owner: `docs-adr-steward` for the ownership decision + `codebase-housekeeper`
  for the file move.

9. **MEDIUM — Register `settings` as scope consumer.** Add
   `\$scope->consumer('settings', new ScopeConsumerConfig(...))` in
   `SettingsServiceProvider::boot()`. Closes EXPECTED-GAP-002.

- Owner: `laravel-feature-builder` (per §4 "Adding a scope consumer" template).

10. **MEDIUM — `SmsOptOut` → `BelongsToTenantOptional`.** Cosmetic uniformity
    fix. Closes WARN-001.

- Owner: `codebase-housekeeper`.

11. **MEDIUM — Reconcile `activities` vs `activity_log` naming.** Either rename
    the workspace table or update the steering doc + hierarchy.md. Closes
    WARN-008.

- Owner: `docs-adr-steward`.

12. **LOW — Verify 12 Auth+Identity+MFA models post-Identity-split**
    (`AuthCrossAppGrant`, `AuthEmailVerification`, `AuthJwtDenyList`,
    `AuthMfaChallenge`, `AuthPasswordReset`, `AuthRefreshToken`, `MfaChallenge`,
    `WebauthnCredential`, `PersonGuardianLink`, `PersonIdentity`,
    `TenantLinkRequest`). Each needs classification as `identity_id`-plane vs
    `tenant_id`-plane and possibly a `BelongsToTenant` (or
    `BelongsToTenantOptional`) trait addition. Closes EXPECTED-GAP-004.

- Owner: `security-compliance-reviewer` (classification) +
  `laravel-feature-builder` (implementation).

13. **LOW — Register Access permission overlay as scope consumer.** Closes
    EXPECTED-GAP-003. Post-step 6.

- Owner: `laravel-feature-builder`.

14. **LOW — Update `hierarchy.md` §14 belongs-to matrix** to include
    `age_groups`, `events`, `seasons`, `orders`, `expenses` with
    `organization_id`. Closes WARN-004.

- Owner: `docs-adr-steward`.

## Cross-agent handoffs

- **Blocks `security-compliance-reviewer`'s audit:** VIO-004
  (`model_has_permissions.application_id`), VIO-005
  (`model_has_roles.application_id`), VIO-006
  (`role_has_permissions.application_id`) — cross-application role-permission
  write paths need runtime verification against `ApplicationMismatch` (422)
  guard. Cannot pass §Req 2 threat-model until the pivot column decision
  (step 7) lands. Also blocks EXPECTED-GAP-004 (Auth model classification).
- **Blocks `data-modeler`'s ERD authorship:** Fix order steps 1-2
  (duplicate/collision migrations) must land before any ERD authoritatively
  describes the schema — the current tree has ambiguous state (which of two
  `Audit` models is canonical? which of two `payment_methods` migrations?).
- **Blocks `docs-adr-steward`:** Steps 2 (Audit consolidation ADR), 6 (§2
  extension for central-plane infrastructure), 8 (payment_methods ownership), 11
  (activity naming), 14 (§14 matrix update) — all require doc-writing before
  code fixes proceed cleanly.
- **Needs `laravel-feature-builder`:** Steps 3, 5, 9, 12, 13 — code-writing on
  packages that are conceptually already-scaffolded but have missing bits.
- **Needs `codebase-housekeeper` (mechanical fixes only):** Steps 1, 4, 7, 10 —
  mechanical migration deletions + trait additions with zero behavioural change.
- **Needs `tenancy-compliance-auditor` (this agent) re-run:** After step 7
  lands, re-run the full audit to confirm the R3 count drops to zero (or to the
  4 central-plane exceptions codified in the step-6 ADR).
