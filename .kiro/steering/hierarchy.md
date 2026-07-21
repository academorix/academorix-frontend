---
inclusion: always
---

# Platform hierarchy & tier boundaries

Canonical structural model for every module across every Stackra application.
This document is authoritative — when in doubt about naming, ordering, or tier
gating, this file wins. Contradict it only with an explicit design note in the
relevant spec.

> **See also** — `tenancy-columns.md` is the sibling steering doc for row-level
> attribution. This doc defines the platform tree; that doc defines which
> columns each row carries to participate in it (`tenant_id`, `application_id`,
> `scope_node_id`), plus the `tenancy-compliance-auditor` agent that scans
> packages against those rules.

## 1. Terminology lock-in

One word per concept. Never let synonyms drift in. This is the canonical
vocabulary reference for the whole backend — the sole source of truth after
`docs/domain-hierarchy.md` was consolidated here on 2026-07-14.

### 1a. Platform + tenancy plane

| Concept                                           | Canonical                       | Reject                              |
| ------------------------------------------------- | ------------------------------- | ----------------------------------- |
| Vendor / super-admin plane                        | **Platform**                    | Central, Ops, Root                  |
| Product line (one of 5 apps)                      | **Application**                 | Product, App, Realm, Namespace      |
| Global credential record (email + password + MFA) | **Identity**                    | Account, Credential, Principal      |
| Paying customer of an Application                 | **Tenant**                      | Account, Workspace, Company         |
| Per-app user (Identity × Application × Tenant)    | **User**                        | Member, Account, Person             |
| Structural sub-brand inside a Tenant              | **Organization**                | Division, Business Unit, Brand      |
| Commercial/regulatory zone                        | **Region**                      | Market, Locale, Zone                |
| Physical venue                                    | **Branch**                      | Location, Site, Store, Property     |
| Bookable resource inside a Branch                 | **Facility**                    | Room, Court, Field, Space, Resource |
| Rostered squad                                    | **Team**                        | Group, Cohort, Class                |
| Platform admin                                    | **PlatformUser**                | Staff, Admin, Root                  |
| Auth secret token                                 | **PAT** (personal access token) | ApiKey, SecretToken                 |
| Machine credential record                         | **ServiceAccount**              | ApiClient, Bot                      |
| Row that pins a User to a Tenant                  | **TenantMember**                | TenantMembership, TenantUser        |

`Identity` and `User` are distinct concepts and never conflated:

- `Identity` is the credential record — one per real human, global across every
  Application.
- `User` is the per-Application projection — an Identity that has been
  provisioned into a specific Tenant on a specific Application, carrying a
  Profile, roles, and status.

### 1b. Domain-plane nouns (target state)

These aggregates live below the Tenant / Application axes. Each has exactly one
canonical class name; synonyms are rejected in review.

| Concept                                                                                 | Canonical                | Reject                                                |
| --------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| Person being coached (may lack a login — often a minor)                                 | **Athlete**              | Learner, Trainee, Student                             |
| Link between an Athlete and a legally responsible User                                  | **AthleteGuardian**      | Parent, ParentLink, GuardianRow                       |
| An Athlete's roster attachment to a Team + Season                                       | **AthleteEnrollment**    | Signup, TeamJoin                                      |
| Employed/engaged person, wraps a User with employment metadata                          | **Staff**                | Employee, StaffMember                                 |
| A Staff row acting as a coach with a sport-specific profile                             | **Coach**                | Trainer, Instructor                                   |
| The parent's paid subscription enrolling an Athlete on a plan (renewing money contract) | **Membership** (Finance) | Enrolment, Signup, Subscription (that's the SaaS one) |
| The academy's SaaS subscription to Stackra (money the tenant owes Stackra)        | **TenantSubscription**   | Subscription (ambiguous with Membership)              |
| A single admission/visit a Membership entitles the Athlete to                           | **Pass**                 | Ticket, Voucher, Credit                               |
| 1:1 PII satellite of a User (name, phone, avatar, locale, tz)                           | **Profile**              | UserProfile (redundant), Details                      |
| Polymorphic roster row on a Team (usually points at an AthleteEnrollment)               | **TeamMember**           | Roster, Player, TeamPlayer                            |

Every reject word is a code-review red flag: either a bug (dead terminology
returning) or a legitimate third-party naming that must be allow-listed
explicitly.

### 1c. Two conflations, resolved

Two English words in the domain collide with themselves. The code disambiguates
by using different nouns so the collision never propagates into a symbol name.

**"Membership" — do NOT confuse.** Two aggregates share the English word; they
never share a class.

| `Finance\Membership`                         | `Tenancy\TenantMember`                            |
| -------------------------------------------- | ------------------------------------------------- |
| A subscription **contract**                  | A **person** with access                          |
| Renews every period, has passes              | Static — a role assignment                        |
| `belongsTo(Athlete, Branch, Region, Tenant)` | `belongsTo(User, Tenant)`                         |
| Owns `Pass` records                          | Carries `role`, `is_staff_only`, `last_active_at` |
| Lives in Finance module                      | Lives in Tenancy module                           |

Rule: never write `Membership` for a user-to-tenant link. Never write
`TenantMember` for a paid contract.

**"Member" — three unrelated aggregates.** Same English root, three different
tables. One real-world person can be all three at once:

- `Tenancy\TenantMember` — a User with access to a Tenant.
- `Teams\TeamMember` — a polymorphic roster row on a Team (usually points at an
  `AthleteEnrollment`, occasionally at a `Coach`).
- (No third row-type — but note `AthleteGuardian` is the parent-child link, not
  a "family member" pivot.)

**"Workspace" — no longer a domain word.** The word "workspace" was frontend UI
copy that leaked into the SDK during the tenancy port. The domain speaks
**Tenant** everywhere. The FE is free to render a Tenant as "workspace" in its
labels — that is a UI decision, not a backend concept. See
`docs/adr/0017-delete-workspace-terminology.md`.

## 2. Structural model — the full tree

Six axes total. Application sits between Platform and Tenant. Organization,
Region, and Branch are three orthogonal axes below Tenant that meet at Branch.

```
Platform (Stackra Inc. — always one)
   │
   └── Application (one of N products, e.g. Sports, Marketplace, ...)
         │
         └── Tenant (customer of that Application)
                │
                │ ┌─────────────┬─────────────┐
                │ │             │             │
                ▼ ▼             ▼             ▼
          Organizations       Users         Regions      (three orthogonal axes)
                 \            /  \           /
                  \          /    \         /
                   \        /      \       /
                    Branches       (identity/roles)     (physical joins Org × Region)
                        │
                        ▼
                    Facilities                          (bookable units in a Branch)
                        │
                        ▼
                 Teams / Sessions /
                 Bookings / Passes / …
```

Rules:

- `tenants.application_id` (required, uuid).
- Tenants are **per-Application** (D2 locked). "Acme Corp on Sports" and "Acme
  Corp on Marketplace" are two distinct Tenant rows.
- `branch.organization_id` (required) + `branch.region_id` (required).
- `regions.organization_id` **must not exist**. Regions are tenant-scoped.
- `facilities.branch_id` (required). No shortcut FKs to Organization or Region —
  those cascade through Branch.
- Domain rows below Tenant SHALL NOT carry `application_id` as a shortcut — it
  cascades through `tenant_id`.
- Every tenant provisions exactly one `is_default = true` Organization and one
  default Region so downstream code never special-cases the single-brand /
  single-region case.

Per-row column contracts — which package carries which of `tenant_id` /
`application_id` / `scope_node_id`, plus the eight rows that carry
`application_id` directly — live in `tenancy-columns.md`. Update that file
whenever you add or move a schema column.

## 3. Identity model — one credential, many app users

Cross-app identity (D1 locked). One `identities` row per real human, one `users`
row per (Identity × Application) pair.

```
identities  (global)               users  (per-Application)
──────────────────                 ──────────────────────────
id (uuid)                          id (uuid)
email (unique, citext)             identity_id ─► identities.id
password_hash                      application_id ─► applications.id
mfa_secret                         tenant_id ─► tenants.id
mfa_recovery_codes                 profile_id ─► profiles.id
email_verified_at                  status (Pending/Active/Disabled)
last_login_at                      last_login_at
locked_until                       created_at
created_at
                                   UNIQUE(identity_id, application_id)
```

One Identity → at most one User per Application. Multi-app users have multiple
`users` rows, one per app.

Login authenticates against `identities`. Token issuance chooses the Application
via the `X-Application-Id` header and resolves the matching `users` row.

## 4. Two-audience boundary

Every request lands under one guard. The two never cross.

| Audience         | Guard            | User model     | ID     | Role rows scoped by                       | Route prefix         |
| ---------------- | ---------------- | -------------- | ------ | ----------------------------------------- | -------------------- |
| Application user | `sanctum`        | `User`         | UUID   | `(application_id, tenant_id)`             | `/api/v1/*`          |
| Platform admin   | `platform_admin` | `PlatformUser` | bigint | `tenant_id = null, application_id = null` | `/api/v1/platform/*` |

Same `permissions` string table, guard-namespaced AND application-namespaced.
`SyncRolePermissions` refuses cross-guard writes with `GuardMismatch` (422). It
also refuses cross-application writes with `ApplicationMismatch` (422). The
`manage-tenants` gate resolves to `manage_tenants` on `platform_admin` with a
`Gate::before` super_admin bypass; platform staff are cross-application by
definition.

Every tenant-audience request MUST carry the `X-Application-Id` header.
Missing/unknown/disabled → 400/404/403 respectively. Platform-audience requests
do not carry the header.

## 5. Scope substrate

Physical data hierarchy is fixed. The **scope** hierarchy is per-tenant
configurable and drives cascading resolution for every configuration-owning
consumer (settings, permissions overlay, feature flags, pricing, notification
prefs).

Default Stackra shape:

```
global → application → tenant → organization → region → branch → team → user
```

Tiers activate only a subset of this tree — see §7 below.

`scope_node_id` on domain data rows is a compliance failure — scope is for
**configuration consumers only** (settings, permissions overlay, feature flags,
pricing, notification prefs). Full list + rationale in `tenancy-columns.md` §4.

## 6. Module responsibility map

| Module               | Owns                                                                                                                     | Consumed by                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `Foundation`         | Base repository/service/controller, envelope                                                                             | every module                        |
| `Application` (new)  | `Application` model, OAuth clients, JWKS keypair rotation, `X-Application-Id` middleware                                 | every identity-service module       |
| `Identity` (new)     | `Identity` model (global credentials), MFA secrets, password hashing                                                     | Auth                                |
| `Tenancy` (upstream) | Tenant model, `BelongsToTenant` global scope, `TenantProvisioning` event; now carries `application_id`                   | every tenant-scoped module          |
| `scope`              | Dynamic hierarchy, materialised-path resolver, `ScopeContext`                                                            | settings, entitlements, auth caches |
| `User`               | `User` (per-app), `PlatformUser`, `Profile`, Fortify actions                                                             | Access, Auth                        |
| `Access`             | Roles, Permissions, Policies, `is_system` flag, scoped by `(application_id, tenant_id)`                                  | every module that authorises        |
| `Auth`               | Login/refresh/2FA/impersonation, `manage-tenants` gate, `CreateTenantOwner` listener, JWT issuance, cross-app SSO grants | frontends                           |
| `Subscription`       | `TenantSubscription` mirror, `BillingGatewayInterface`, lifecycle events; scoped by `(application_id, tenant_id)`        | Entitlements                        |
| `Entitlements`       | `EntitlementGate`, slot + pool licenses, provisioner, reconciler; scoped by `(application_id, tenant_id)`                | every tenant-mutating action        |
| `Region`             | `Region` (currency / tax / timezone / locale)                                                                            | Branch, Finance                     |
| `Organization`       | `Organization` (structural, may nest)                                                                                    | Branch, Teams                       |
| `Branch`             | `Branch` (venue)                                                                                                         | Facility, Teams, every domain row   |
| `Facility` (planned) | `Facility`, bookings, passes                                                                                             | Sessions, Finance                   |
| `Teams`              | `Team`, `TeamMember`, `TeamTrial`, `EventTeam`                                                                           | Sessions, Attendance                |
| `settings`           | Attribute-driven config, hierarchy resolution, presets                                                                   | every configurable feature          |
| `Audit`              | Read-only surface over `owen-it/laravel-auditing`; rows carry `application_id`                                           | compliance, DPO                     |
| `Activity`           | Read-only surface over `spatie/laravel-activitylog`; rows carry `application_id`                                         | end-user feeds                      |
| `AI`                 | Personas, tools, draft-then-confirm flow                                                                                 | tenant end-users                    |

## 7. Tier matrix

Tier is set on the tenant's active `Subscription` per Application and
materialised into `Entitlements` grants. A single Identity can hold different
tiers in different Applications. Domain code depends on the gate, not on the
tier.

| Capability            | Small                                  | Medium                                       | Enterprise                                |
| --------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------------------- |
| Organizations         | 1 (default, locked)                    | up to 5, no nesting                          | unlimited + nesting                       |
| Regions               | 1 (default, locked)                    | up to 3                                      | unlimited                                 |
| Branches              | up to 3                                | up to 25                                     | unlimited                                 |
| Facilities            | disabled                               | basic booking                                | advanced (recurring, blackouts, packages) |
| Teams                 | up to 10                               | up to 100                                    | unlimited                                 |
| Users                 | up to 15                               | up to 250                                    | unlimited                                 |
| Custom roles          | none (system roles only)               | up to 10                                     | unlimited                                 |
| Scope levels active   | `global → application → tenant → user` | `global → application → tenant → org → user` | full tree                                 |
| Audit retention       | 90 days                                | 1 year                                       | 7 years / configurable                    |
| Activity retention    | 30 days                                | 90 days                                      | 1 year                                    |
| SSO                   | password only                          | email-domain autolink                        | SAML + OIDC + SCIM                        |
| Cross-app SSO         | disabled                               | enabled                                      | enabled + per-app policy                  |
| 2FA                   | optional                               | required for admins                          | required for all + hardware keys          |
| API rate limit        | 60 rpm                                 | 600 rpm                                      | 6000 rpm or custom                        |
| AI persona set        | Coach, Parent                          | + Admin, Staff, Reception                    | full + custom personas + MCP              |
| AI monthly token pool | 100 k                                  | 1 M                                          | 10 M or metered                           |
| Data residency        | shared region                          | tenant-selected region                       | dedicated tenant DB (opt-in)              |
| Support SLA           | community                              | business hours                               | 24/7 + dedicated CSM                      |

## 8. Entitlement key registry

Feature flags (boolean, gated by `EntitlementGate::isFeatureEntitled()`;
composite key = `(application_id, tenant_id, feature_key)`):

```
organizations
organization_hierarchy
regions
facilities
facilities_advanced
custom_roles
sso_email_domain
sso_saml
sso_oidc
scim_provisioning
cross_app_sso
audit_retention_extended
ai_personas_extended
ai_mcp
api_extended
data_residency_choice
dedicated_database
```

Slot quotas (integer counts; composite key includes application):

```
organization_slot
region_slot
branch_slot
facility_slot
team_slot
user_slot
custom_role_slot
```

Token pools (integer draws):

```
ai_token_pool_month
```

## 9. Enforcement points

- **Application check** — `ResolveApplication` middleware runs on every
  tenant-audience request before tenant resolution. Missing header → 400
  `missing_application`; unknown slug → 404 `unknown_application`; disabled →
  403 `application_disabled`.
- **Slot check** — in the model's `creating` observer (or the action):
  `EntitlementGate::consume('branch_slot')` against the current
  `(application_id, tenant_id)`. Releases in `deleted` / `archived`.
- **Feature check** — in policies (`before` hook) or controller early-return:
  `EntitlementGate::isFeatureEntitled('organizations')` → 403
  `FeatureNotEntitledException`.
- **Scope levels** — `ScopeDefinitionSeeder` reads the tier from the active
  per-Application subscription and inserts only the allowed rows into
  `scope_definitions`. Upgrades run an idempotent re-seed.
- **Retention** — scheduled per-tenant `PruneAuditLogsCommand` and
  `PruneActivityLogsCommand` read the tier's retention window.
- **AI persona gate** — `ai.persona-role` middleware checks tier entitlement
  before the persona-role gate fires.
- **JWT `app` claim** — downstream services verify `app` matches their
  deployment; mismatch → 403.

## 10. Tier transitions

- **Upgrade** — increases quotas; no data changes. New feature flags flip on.
  `EntitlementProvisioner` re-runs on `PlanChanged`.
- **Downgrade** — deferred to period end. At the boundary,
  `EntitlementReconciler` checks for over-quota state:
  - `user_slot` over → freeze new invites; existing users remain.
  - `branch_slot` over → freeze new branches; existing archive-eligible.
  - `organization_hierarchy` off → flatten `parent_id` on non-default orgs
    (children reparent to tenant root).
- **Cancel** — enters `SubscriptionStatus::grace_period` for the plan's grace
  days; entitlements stay active. On expiry `GraceLapseCommand` transitions to
  `lapsed`; reads-only stance applies to entitlement- gated write paths.

## 11. Observability signals

Two distinct signals, two packages, two stores. Never merge them.

- **`Audit`** — automatic, field-level diffs (`owen-it/laravel-auditing`).
  Compliance signal. Immutable. High volume. Long retention. Rows carry
  `application_id`.
- **`Activity`** — explicit call-site logs (`spatie/laravel-activitylog`).
  Product feed. Human-readable. Medium volume. Short retention. Rows carry
  `application_id`.

Full decision tree lives at `.kiro/specs/observability/design.md`.

## 12. Service split

```
identity-service              SHARED across all Applications
    ├── modules/foundation
    ├── modules/application    Application, OAuth clients, JWKS
    ├── modules/identity       Global credentials + MFA
    ├── modules/tenancy        Tenant (with application_id)
    ├── modules/user           per-Application User + Profile
    ├── modules/access         Roles + Permissions (app-scoped)
    ├── modules/auth           Login, JWT issuance, cross-app SSO
    └── modules/scope

commerce-service              SHARED
    ├── modules/subscription   TenantSubscription (with application_id)
    └── modules/entitlements   Licenses (with application_id)

backend-service               ONE DEPLOYMENT PER APPLICATION
    ├── modules/region
    ├── modules/organization
    ├── modules/branch
    ├── modules/facility
    ├── modules/teams
    └── modules/<domain>       app-specific domain modules

ai-service                    ONE DEPLOYMENT PER APPLICATION
observability-service         SHARED (or per-app; either works)
```

Cross-service auth: identity-service issues JWTs, publishes JWKS, everyone else
verifies signatures locally. JWT `app` claim binds a token to a single
Application; downstream services reject mismatched tokens. No per-request
cross-calls to identity for permission checks — the JWT carries claims.

Never split `Identity` from `User`, `User` from `Access`, `Auth` from
`Identity`, or `Subscription` from `Entitlements`. Provisioning atomicity
depends on the co-location.

Full contract at `.kiro/specs/identity/design.md`.

## 13. Non-goals

- **No cross-tenant reads or writes** below the platform plane. Even reporting
  rollups run against per-tenant materialised views.
- **No cross-application role rows.** A role in Sports has no meaning in
  Marketplace. Enforced by `ApplicationMismatch` on writes.
- **No cross-guard role rows.** A `sanctum` role never holds a `platform_admin`
  permission, and vice versa.
- **No hardcoded tier checks in domain code.** Domain code depends on the
  entitlement gate. `if ($tenant->tier === 'enterprise')` in a policy is a bug.
- **No `application_id` shortcut on domain rows below Tenant.** Application
  cascades through `tenant_id`. Only Tenant, User, Role, Permission,
  Subscription, Entitlement License, Audit, and Activity carry `application_id`
  directly.
- **No `region_id` on `organizations`.** They are orthogonal.
- **No `organization_id` on `facilities` or `regions`.** They cascade through
  Branch, or belong directly to Tenant.
- **No cross-app Identity merging without user consent.** Merging two Identities
  requires an explicit "link accounts" flow with verification.
- **No shared password hash between Identities.** Each Identity has its own
  hash. Cross-app SSO is grant-based, not credential-based.

Enforcement of every non-goal above (plus the layered column rules) lives in
`tenancy-columns.md` §5 (forbidden columns) and §7 (the
`tenancy-compliance-auditor` agent that scans a package against them). Invoke on
demand via `invoke_sub_agent(name: "tenancy-compliance-auditor")` or the
save-time reminder in `.kiro/hooks/tenancy-columns-check.json`.

## 14. Belongs-to matrix

Reading this table: each row belongs to each ✓ column. Blank means "no direct FK
— reach it via another aggregate". This is the target domain surface once the
domain modules under `apps/api/src/modules/` land per ADR-0014; today only
`access/` + `tenancy/` are scaffolded, but the matrix pins the intended shape so
migrations don't drift.

| Aggregate          | Tenant | Region | Organization | Branch | Team | User | Staff | Athlete | Season | AgeGroup |
| ------------------ | :----: | :----: | :----------: | :----: | :--: | :--: | :---: | :-----: | :----: | :------: |
| Region             |   ✓    |        |              |        |      |      |       |         |        |          |
| Organization       |   ✓    |        |              |        |      |      |       |         |        |          |
| Branch             |   ✓    |   ✓    |      ✓       |        |      |      |       |         |        |          |
| Facility           |   ✓    |        |              |   ✓    |      |      |       |         |        |          |
| TenantMember       |   ✓    |        |              |        |      |  ✓   |       |         |        |          |
| TenantSubscription |   ✓    |        |              |        |      |      |       |         |        |          |
| User               |   ✓    |        |              |        |      |      |       |         |        |          |
| Profile            |   ✓    |        |              |        |      |  ✓   |       |         |        |          |
| Staff              |   ✓    |        |              |   ✓    |      |  ✓   |       |         |        |          |
| Coach              |   ✓    |        |              |   ✓    |      |      |   ✓   |         |        |          |
| Athlete            |   ✓    |        |              |   ✓    |      |      |       |         |        |          |
| AthleteGuardian    |   ✓    |        |              |        |      |  ✓   |       |    ✓    |        |          |
| AthleteEnrollment  |   ✓    |        |              |   ✓    |  ✓   |      |       |    ✓    |   ✓    |          |
| Finance.Membership |   ✓    |   ✓    |              |   ✓    |      |      |       |    ✓    |        |          |
| Team               |   ✓    |        |              |   ✓    |      |      |       |         |   ✓    |    ✓     |
| TeamMember         |   ✓    |        |              |        |  ✓   |      |       |         |        |          |

The trait-driven pattern: composing `BelongsToTenant` adds the tenant scope +
FK, `BelongsToBranch` adds the branch FK, and so on. **Order of traits matters**
— `BelongsToTenant` must come first so subsequent traits observe the tenant
context in their `booted()` hooks.

## 15. How access control maps onto the hierarchy

Two independent mechanisms stack. Row-level scoping runs regardless of the authz
story; role/permission checks run on top.

**1. Row-level tenant scoping** (`BelongsToTenant`)

- Enforced globally on every model that composes the trait.
- Queries automatically filter to the active tenant (`tenant_id = ?`).
- Cross-tenant reads return zero rows.
- Write attempts against a foreign tenant raise.

**2. Role/permission checks** (`Access` module + Scope framework)

- Spatie-permission with guard-namespaced roles: `sanctum` guard vs
  `platform_admin` guard, isolated so a tenant role cannot leak to a platform
  admin.
- A `Role` on a `User` (via `TenantMember.role`) grants tenant-wide
  capabilities.
- The scope framework narrows further:
  `global → application → tenant → organization → region → branch → team → user`.
  A coach's grant may be scoped to a single Team via a `ScopeValue` binding; the
  `ResolveScope` middleware picks the caller's active scope at request time.

**3. Sensitivity gating** (AI service only)

- AI tools declare a `Sensitivity` enum (`Public` / `Pii` / `Medical` /
  `Financial`).
- The `SensitiveTool` base + `TenantContext` binding ensures every AI read stays
  inside the caller's tenant scope.
- The `WritableTool` base enforces draft-then-confirm so LLM writes always yield
  to a human confirm step.

## 16. Adding a new domain model — decision ladder

Walk this ladder every time you introduce a new aggregate. The answer at each
step decides your traits, your module, and your access-control story.

**Step 1 — Which layer?**

- Reference data with no tenancy → platform plane (no `tenant_id`).
- Belongs to the tenant itself → tenant-scoped, direct child of Tenant.
- A partition of the tenant → tenant-scoped (Region or Organization).
- A physical venue → tenant-scoped, `BelongsToBranch`.
- A group inside a Branch → tenant-scoped, `BelongsToBranch`, plus any parent
  (Team, Facility, Season).
- A person → tenant-scoped, plus the appropriate identity trait
  (`BelongsToUser`, `BelongsToStaff`, `BelongsToAthlete`).
- A financial contract on a person → tenant-scoped, plus `BelongsToAthlete` +
  `BelongsToBranch` + `BelongsToRegion`.

**Step 2 — Which traits?**

The composition order is significant. Copy the block from any existing model at
the same layer:

```php
use Auditable;                       // owen-it/laravel-auditing
use BelongsToTenant;                 // MUST come first — see §14 above
use BelongsToRegion;                 // if the aggregate has commercial context
use BelongsToOrganization;           // if the aggregate has a brand context
use BelongsToBranch;                 // if it lives at a venue
use BelongsToUser;                   // if it FKs an authenticated actor
use BelongsToAthlete;                // if it's an athlete-centric aggregate
use BelongsToStaff;                  // if it's a staff-centric aggregate
use HasFactory;
use HasPrefixedUlid;                 // fills `xxx_<ulid>` on creating
use HasSlug;                         // if the aggregate has a URL slug
use SoftDeletes;
use Userstamps;                      // populates created_by/updated_by/deleted_by
```

**Step 3 — Which module?**

Pick the module whose bounded context owns the aggregate. If the aggregate is a
satellite of another (e.g. `StaffLeave` is a satellite of `Staff`), put it in
the parent's module. If it's a new domain, spin up a new module under
`apps/api/src/modules/<name>/` per ADR-0014 (lowercase folder).

**Step 4 — Which ADRs apply?**

- ADR-0006 — Attribute-first DI (no manual bindings, no closures in providers).
- ADR-0016 — Every HTTP endpoint is a single-invoke Action with `#[AsAction]` +
  `use AsController;`. (Supersedes ADR-0013.)
- ADR-0017 — Tenancy terminology (no `Workspace`, no `TenantMembership`,
  distinguished `Membership` vs `TenantMember`).
- ADR-0019 — Tenant settings go through `stackra/settings`.
- ADR-0020 — Bootstrapper vs TenancyHook are two different concepts.

Architecture rules the aggregate must satisfy:
`EnumUsesStackraEnumTraitRule`, `ServiceProviderHasModuleAttributeRule`,
`ExceptionsExtendStackraBaseRule`, `ActionHasAsActionAttributeRule`,
`NoServiceLayerRule`, `NoBaseControllerRule`, `NoWorkspaceInBackendRule`,
`NoTenantMembershipTokenRule`.

**Step 5 — Which SDK?**

If external services (ai-service, mobile, FE) need to consume the aggregate,
add:

- A wire-visible DTO in `apps/api/src/modules/<name>/sdk/src/Data/`.
- A Saloon request per endpoint in
  `apps/api/src/modules/<name>/sdk/src/Saloon/`.
- Register a sub-resource on the module's `#[AsSdkResource]` class.

**Step 6 — Which AI tools?**

If the aggregate should be reachable by an AI persona, add tools under
`apps/ai-service/src/modules/ai/src/Tools/<Module>/`:

- Read tools extend `SensitiveTool`.
- Write tools extend `WritableTool` (draft-then-confirm).
- Never import the aggregate's Eloquent model directly — always go through the
  SDK.

## 17. Common questions

**Q: Can a User belong to two Tenants?**

Per the Identity split (§3), an `Identity` has at most one `User` per
`Application`. Multi-app humans have multiple `User` rows, one per app. Within a
single Application, the older backend had one `tenant_id` per user; the new
model uses `TenantMember` pivot rows so a single `User` row can be a member of
multiple Tenants inside the same Application (workspace switcher). The
`users.tenant_id` column stays as the user's "home" tenant.

**Q: Where does a Coach's login live?**

On the underlying `User` record. `Staff` wraps a `User`, `Coach` wraps a
`Staff`, and all three carry `tenant_id`. Auth flows through `User`; role checks
resolve through `TenantMember.role` for the active tenant.

**Q: Why isn't Athlete a User?**

Because children often don't have accounts. Athletes carry no login. The parent
— a `User` — is linked via `AthleteGuardian`. When an athlete is old enough to
log in, provision a `User` for them and add an `AthleteGuardian` row where
`user_id` = the athlete's own new user.

**Q: Why two axes (Region + Organization) under Tenant?**

They solve independent problems. **Region** answers "what currency / tax /
timezone applies here" — commercial and regulatory. **Organization** answers
"which brand does this belong to" — structural. A tenant running two brands in
one country has one Region + two Organizations; a tenant running one brand in
three countries has three Regions + one Organization. They meet at Branch, which
carries both FKs.

**Q: Where does subscription/billing live — Subscription or Entitlements?**

`Subscription` owns the **money side** (Paddle mirror, coupons, credits,
refunds, chargebacks). `Entitlements` owns the **capability side** (does this
plan allow this feature? how many uses is the tenant allowed?). Together they
say "the tenant is on the Pro plan (Subscription) which lets them run 100 AI
queries per month (Entitlements)".

**Q: Is `Finance\Membership` different from `TenantSubscription`?**

Yes, totally.

- `TenantSubscription` = the **academy pays Stackra** (SaaS billing).
- `Finance\Membership` = the **parent pays the academy** for their athlete's
  enrolment. Runs on the academy's Stripe/Paddle account, not Stackra's.

**Q: What renames from the workspace terminology cleanup?**

See `docs/adr/0017-delete-workspace-terminology.md`. Summary: `Workspace*` →
`Tenant*`, `TenantMembership` → `TenantMember`, table `tenant_memberships` →
`tenant_members`. No aliases, single-shot rename, guarded by two architecture
rules (`NoWorkspaceInBackendRule`, `NoTenantMembershipTokenRule`).

**Q: What if I need a canonical noun that's not in §1?**

Add it here in the same commit that introduces the code. New nouns land in §1a
(platform plane) or §1b (domain plane), with the reject list explicit. Any add
here obsoletes the sibling entry in `docs/domain-hierarchy.md` — which is why we
consolidated the two docs into this one.
