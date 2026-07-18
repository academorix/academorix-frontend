---
inclusion: always
---

# Tenancy, application, and scope columns

> **ADR anchor.** This steering codifies
> [ADR-0024](../../docs/adr/0024-row-level-attribution-three-axes.md) —
> Row-level attribution: three-axes column contract (`tenant_id` /
> `application_id` / `scope_node_id`). §§1-5 below are the enforceable surface
> of that ADR; §§6-9 are its operational tail (enforcement points, auditor
> agent, migration templates, living gap register).

Row-level attribution contract for every Academorix package. Complements
`hierarchy.md` — the parent doc defines the platform tree; this doc defines
which columns each row carries to participate in that tree. When the two
disagree, `hierarchy.md` wins.

Contradict this file only with an explicit design note in the relevant spec.
Every change to the column mandate below is a migration event — treat it as
such.

## 1. The three orthogonal axes

Three column families answer three different questions. They do NOT substitute
for each other. A row can need one, two, or three of them; most rows need one.

| Axis            | Column                                 | Answers                                                        | Substrate                                                                                                      |
| --------------- | -------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Tenant**      | `tenant_id` (uuid)                     | "Which tenant owns this row?"                                  | Direct FK. `BelongsToTenant` trait applies the global scope + fills the column on save.                        |
| **Application** | `application_id` (uuid)                | "Which of the N Academorix products does this row belong to?"  | Direct FK on the 8 top-level rows only. Cascades through `tenant_id` for everything else — never a shortcut.   |
| **Scope**       | `scope_node_id` (uuid) + `#[ScopedTo]` | "What cascading-resolution path does this row participate in?" | `academorix/scope` substrate. Materialised path. **Configuration consumers only** — never on domain data rows. |

Rule of thumb: if you can't state the question your column answers in one
sentence from that table, you're using the wrong axis.

## 2. The `application_id` mandate (locked)

Only **eight** row types carry `application_id` directly. Every other row
cascades through `tenant_id`.

```
Row                        Column                Notes
─────────────────────────  ────────────────────  ──────────────────────────
tenants                    application_id  ✅    required, UNIQUE(application_id, slug)
users                      application_id  ✅    required, UNIQUE(identity_id, application_id)
roles                      application_id  ✅    nullable (null = platform_admin guard)
permissions                application_id  ✅    nullable (null = platform_admin guard)
tenant_subscriptions       application_id  ✅    required, scoped by (application_id, tenant_id)
entitlement_licenses       application_id  ✅    required, scoped by (application_id, tenant_id)
audits                     application_id  ✅    required for tenant-audience, nullable for platform
activity_log               application_id  ✅    required for tenant-audience, nullable for platform
```

**Everything else is forbidden from carrying `application_id`.** Application
flows through `tenant_id → tenants.application_id`. Adding `application_id` to
Branch, Team, Organization, Facility, Region, User's Profile, or any
AI/Auth/Access domain row is a schema violation.

Enforced by:

- Migration review — every new migration that adds `application_id` outside the
  8 rows must be rejected.
- `ApplicationMismatch` (422) on cross-app writes at the write path.
- The **tenancy-compliance-auditor** agent (see §7).

## 3. The `tenant_id` mandate

Every domain row that lives below Tenant carries `tenant_id`. Every module below
owns rows tenant-scoped this way. Use the
`Academorix\Tenancy\Concerns\BelongsToTenant` trait — it applies the global
scope + auto-fills on save + registers the FK.

### Package matrix (current + target)

| Package          | Rows                                                                                          | Uses `BelongsToTenant`                                                              | State                                                                 |
| ---------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Tenancy**      | `tenants`                                                                                     | (owns it)                                                                           | ✅ carries `application_id`                                           |
| **User**         | `User`, `Profile`, `ServiceAccount`, `PlatformUser`                                           | ✅ (except PlatformUser)                                                            | PlatformUser is central-plane and correctly has no tenant_id          |
| **Access**       | `Role`, `Permission`                                                                          | via spatie's `teams=true` — same column, spatie-managed                             | ✅                                                                    |
| **Auth**         | `MfaMethod`, `SocialAccount`, `WebAuthnCredential`, `OAuthClient`                             | Mixed — identity-plane objects belong to `identity_id` post-split; audit each model | Verify post-Identity-spec                                             |
| **Organization** | `Organization`                                                                                | ✅                                                                                  | ✅                                                                    |
| **Region**       | `Region`                                                                                      | ✅                                                                                  | ✅                                                                    |
| **Branch**       | `Branch`                                                                                      | ✅                                                                                  | ✅ + carries `organization_id` + `region_id`                          |
| **Facilities**   | `Facility`, `ResourceBooking`, `DayPass`, `Pass`                                              | ✅                                                                                  | ✅ (Facility cascades through `branch_id`, no direct organization_id) |
| **Teams**        | `Team`, `TeamMember`, `TeamTrial`, `EventTeam`                                                | ✅                                                                                  | ✅ + Team carries `organization_id` + `branch_id`                     |
| **Subscription** | `TenantSubscription`, `Chargeback`, `CouponRedemption`, `CreditMemo`, `Refund`, `Transaction` | ✅                                                                                  | ✅                                                                    |
| **Entitlements** | `EntitlementLicense`, `LicenseUsage`, `Grant`                                                 | ✅                                                                                  | ✅                                                                    |
| **AI**           | `AiRun`, `AiToolCall`, `AiDraft`                                                              | ✅ (via migration column)                                                           | ✅                                                                    |
| **Audit**        | `audits`                                                                                      | ❌ — tenant_id lives in `new_values` JSON blob                                      | **Gap** — add `tenant_id` column + index                              |
| **Activity**     | `activity_log`                                                                                | ❌ — tenant_id lives in `properties` JSON blob                                      | **Gap** — add `tenant_id` column + index                              |
| **settings**     | Consumes scope substrate                                                                      | N/A — owns no tenant-scoped domain rows                                             | ✅                                                                    |
| **scope**        | `scope_nodes`, `scope_definitions`, `scope_values`, `scope_aliases`                           | Uses `owner_id` (semantic = tenant, different column name for substrate reasons)    | ✅                                                                    |
| **Foundation**   | (framework tier)                                                                              | N/A                                                                                 | ✅                                                                    |

### Two known gaps

1. **Audit** — the vendor `owen-it/laravel-auditing` `audits` table ships
   without a `tenant_id` column. Compliance queries currently extract tenant id
   from the `new_values` JSON blob, which prevents indexing. **Action:** add
   `tenant_id UUID NULL, INDEX(tenant_id, created_at)` via a module migration +
   trait `BelongsToTenant` on the module's `Audit` model. Backfill from
   `new_values.tenant_id` for existing rows.
2. **Activity** — the vendor `spatie/laravel-activitylog` `activity_log` table
   ships without a `tenant_id` column. Same pattern, same fix.

## 4. The scope substrate mandate

`scope_node_id` is **not** a general-purpose tenancy column. It exists for one
job: cascading value resolution across a per-tenant configurable hierarchy. Only
**configuration consumers** integrate with it.

### Who integrates with scope

| Package                                   | Role                     | Notes                                                                         |
| ----------------------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| **scope**                                 | Owner                    | Provides `ScopeNode`, `ScopeValue`, `#[ScopedTo]`, `ResolveScope` middleware. |
| **settings**                              | Consumer                 | Uses `Scope::resolve('settings', $key)` for hierarchical value resolution.    |
| **Access** (permissions overlay)          | Consumer, planned        | Cascading permission grants through the tree.                                 |
| **Entitlements** (feature flags + quotas) | Consumer, planned        | Reads tier + flag values via scope.                                           |
| **Subscription** (pricing)                | Consumer, planned        | Per-node pricing overrides.                                                   |
| **notifications**                         | Consumer, planned        | Per-user / per-branch prefs.                                                  |
| Every other package                       | **Not a scope consumer** | Do not add `scope_node_id` to domain data rows.                               |

The Application, Tenant, Organization, Region, Branch, Team, User models are
**entities** the scope nodes reference (via `scope_nodes.entity_id`) — not
consumers of scope resolution. Reverse lookup is what the substrate does; the
entities themselves stay clean.

### Adding a scope consumer

Two steps for a package that legitimately consumes scope:

1. Register the namespace in the module's `ServiceProvider::boot()`:

   ```php
   public function boot(ScopeRegistryInterface $scope): void
   {
       parent::boot();
       $scope->consumer('settings', new ScopeConsumerConfig(
           defaultValueFactory: fn (string $key) => null,
           validator: fn (mixed $value) => is_scalar($value) || is_array($value),
       ));
   }
   ```

2. Store keyed values against nodes (never against domain rows):
   `scope_values(scope_node_id, namespace, key, value)`.

Domain data rows still use `tenant_id`. Scope only owns config.

## 5. Non-goals (forbidden columns)

These columns must NEVER exist. Each one exists elsewhere for a reason; the
shortcut always drifts.

| Forbidden                                                         | On                                                        | Why                                                               | Correct path                                        |
| ----------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------- |
| `application_id`                                                  | Any row below Tenant except the 8 named in §2             | Cascades through `tenant_id`                                      | Join through `tenants` if the answer's ever needed  |
| `region_id`                                                       | `organizations`                                           | Regions + Orgs are orthogonal                                     | They meet at Branch                                 |
| `organization_id`                                                 | `facilities`, `regions`                                   | Facilities cascade through `branch_id`; Regions are tenant-scoped | Join through `branches` for facility→org            |
| `scope_node_id`                                                   | Any tenant-scoped domain row that isn't a config consumer | Not what scope is for                                             | Use `tenant_id`                                     |
| Any FK crossing tenants                                           | Everywhere below the platform plane                       | Tenant isolation is a hard boundary                               | Per-tenant materialised views for reporting rollups |
| Cross-guard role/permission rows                                  | `roles`, `permissions`                                    | `sanctum` and `platform_admin` never mix                          | `GuardMismatch` (422) on write                      |
| Cross-application role/permission rows                            | `roles`, `permissions`                                    | Sports role ≠ Marketplace role                                    | `ApplicationMismatch` (422) on write                |
| `parent_id` chains that cross `application_id` on `organizations` | `organizations`                                           | Applications are hard boundaries                                  | Reject at the write path                            |

## 6. Enforcement points

Enforcement is layered — every layer catches what the layer above missed.

1. **Migration review** — every new migration adding a column above (or a
   forbidden column) requires a passing pass from the
   `tenancy-compliance-auditor` agent (§7).
2. **`BelongsToTenant` trait** — auto-fills `tenant_id` on save and applies the
   global read scope. Missing trait on a tenant-scoped model is a compliance
   failure.
3. **`ApplicationMismatch` / `GuardMismatch` (422)** — write-path guards in
   `SyncRolePermissions` and every Application-aware action.
4. **`ResolveApplication` middleware** — rejects requests missing
   `X-Application-Id` (400 / 404 / 403 per spec §Req 2).
5. **`ScopeDefinitionSeeder`** — reads the tier from the active per-Application
   subscription and inserts only allowed rows.
6. **The auditor agent** (§7) — invoked on demand or via the `PostFileSave` hook
   to scan a package for compliance.

## 7. The tenancy-compliance-auditor agent

Custom agent that scans one package (or the whole codebase) against this
mandate. Invoke via `invoke_sub_agent` with
`name: "tenancy-compliance-auditor"`.

**When it fires:**

- On demand: `@tenancy-compliance-auditor audit the Access module`.
- On save: the `.kiro/hooks/tenancy-columns-check.json` hook reminds this
  steering doc exists when a package's `Contracts/Data/*Interface.php`,
  `Models/*.php`, or `database/migrations/*.php` file is saved.
- Pre-commit / CI: recommended but not required.

**What it checks (structured report):**

1. **Missing required column** — package advertises tenant- scoping in its
   module.json / composer.json but a model lacks `tenant_id`.
2. **Illegal `application_id`** — row outside the 8 named rows carries
   `application_id` directly.
3. **Illegal shortcut FKs** — `region_id` on `organizations`, `organization_id`
   on `facilities` or `regions`, etc.
4. **Missing `BelongsToTenant`** — tenant-scoped model that doesn't apply the
   trait.
5. **Illegal scope adoption** — non-config-consumer package adds `scope_node_id`
   or `#[ScopedTo]`.
6. **Cross-tenant/cross-guard/cross-app FKs** — any FK column pointing at a row
   in a different tenant / guard / application.
7. **Naming drift** — `owner_id` outside `scope_nodes`, `workspace_id` where
   `tenant_id` is expected, etc.

**Output shape (structured markdown):**

```
# Tenancy compliance report — <package>

## Summary
- Compliant: <count>
- Violations: <count>
- Warnings: <count>

## Violations
### VIO-001 <package/path/file.php>:<line> — <rule id>
<one-paragraph description>
**Fix:** <suggested migration or code change>

## Warnings
...

## Passing checks
...
```

Reports are advisory — the agent never edits files. It reports findings and
suggests fixes; a human (or a follow-up prompt) applies the change.

## 8. Migration templates

Copy-paste-ready shapes for the most common operations. Every template assumes
Foundation's `AsDatabaseBlueprint` conventions.

### Add `tenant_id` to an existing vendor table

```php
// database/migrations/2026_XX_XX_XXXXXX_add_tenant_id_to_<table>.php
public function up(): void
{
    Schema::table(config('<vendor_config_key>.table_name', '<default>'), function (Blueprint $t) {
        $t->uuid('tenant_id')->nullable()->after('id');
        $t->index(['tenant_id', 'created_at']);
    });
}

public function down(): void
{
    Schema::table('<table>', function (Blueprint $t) {
        $t->dropIndex(['tenant_id', 'created_at']);
        $t->dropColumn('tenant_id');
    });
}
```

Then on the model:

```php
use Academorix\Tenancy\Concerns\BelongsToTenant;

final class <Model> extends VendorModel
{
    use BelongsToTenant;
}
```

### Add `application_id` (only if the row is one of the 8)

```php
public function up(): void
{
    Schema::table('<table>', function (Blueprint $t) {
        $t->uuid('application_id')->after('id');
        $t->foreign('application_id')->references('id')->on('applications');
        $t->index(['application_id', 'tenant_id']); // for composite scoping
    });
}
```

Also update `<Model>Interface::ATTR_APPLICATION_ID = 'application_id'`.

### Register a scope consumer namespace

```php
// In the module's ServiceProvider::boot()
public function boot(ScopeRegistryInterface $scope): void
{
    parent::boot();

    $scope->consumer('<my_namespace>', new ScopeConsumerConfig(
        defaultValueFactory: fn (string $key) => $this->defaultFor($key),
        validator: fn (mixed $value) => $this->validate($value),
    ));
}
```

## 9. Living gap register

Update this section every time a schema change lands or a new package joins the
codebase. The auditor agent reads it to know what's expected to exist vs what's
a known deferred fix.

| Gap                                                                                                                               | Owner                       | Blocker                                      | Priority |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------------- | -------- |
| Add `tenant_id` to `audits`                                                                                                       | Audit module                | None                                         | High     |
| Add `tenant_id` to `activity_log`                                                                                                 | Activity module             | None                                         | High     |
| Split `User` into `Identity` + `User` (per-app)                                                                                   | Identity + User modules     | Identity spec landing                        | High     |
| Add `application_id` to `tenants`                                                                                                 | Tenancy module              | Application module scaffold                  | High     |
| Add `application_id` to `users` (post-split)                                                                                      | User module                 | Identity split                               | High     |
| Add `application_id` to `roles`, `permissions`                                                                                    | Access module               | Application module scaffold                  | High     |
| Add `application_id` to `tenant_subscriptions`, `entitlement_licenses`                                                            | Subscription + Entitlements | Application module scaffold                  | High     |
| Add `application_id` to `audits`, `activity_log`                                                                                  | Audit + Activity            | Post-tenant_id + Application module scaffold | Medium   |
| Register `settings` as scope consumer                                                                                             | settings module             | None                                         | Medium   |
| Register `Access` permission overlay as scope consumer                                                                            | Access module               | Post-Identity split                          | Low      |
| Verify Auth models against Identity split                                                                                         | Auth module                 | Identity spec landing                        | Deferred |
| `ServiceAccount` model + `service_accounts` migration (Laravel side of `docs/contracts/service-identity.schema.json`)             | Auth / Access               | None                                         | High     |
| `ServiceJwt` signer + verifier (Laravel side of `docs/contracts/service-jwt.schema.json`; HS256, `>=32`-byte secret from Doppler) | Auth                        | `ServiceAccount` landing                     | High     |
| `packages/domain/` — shared HTTP-DTO package referenced by `docs/service-boundary.md` + `docs/contracts/README.md`                | Foundation                  | `docs/contracts/*.schema.json` finalised     | Medium   |

## 10. Cross-references

- `hierarchy.md` — canonical platform tree + tier boundaries.
- `.kiro/specs/identity/design.md` — Identity + Application module contracts
  (D1–D3 locked).
- `.kiro/specs/observability/design.md` — the two-signal audit/activity split.
- `.kiro/hooks/tenancy-columns-check.json` — save-time reminder.
- `invoke_sub_agent(name: "tenancy-compliance-auditor")` — on-demand package
  audit.
