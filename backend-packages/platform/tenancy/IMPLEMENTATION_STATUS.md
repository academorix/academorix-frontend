# platform/tenancy — Phase 3 implementation status

## Status: PARTIAL — provisioning + CRUD + lifecycle landed; deletion grace + workspace-switcher pending

## What landed

### Aggregate

- `Tenant` model + `TenantInterface` column contract — implements
  `BelongsToTenant` semantics via
  `Stancl\Tenancy\Database\Concerns\CentralConnection` (central-plane
  row that OWNS the tenant scope, does not participate in it).
  `Fillable` covers `application_id`, `slug`, `name`, `legal_name`,
  `business_type`, `locale`, `timezone`, `currency`, `country_code`,
  `status`, `deletion_scheduled_at`.
- `TenantContact` — 1:N contact rows attached to a tenant (billing,
  DPO, tech, ...).

### Support services

- `TenantResolver` — resolves the active tenant from the incoming
  request (`X-Tenant-Id` header, subdomain, custom domain path).
  `#[Scoped]`.
- `TenantContextResolver` — a `#[Scoped]` service implementing
  `TenantContextInterface`. Everything downstream reads
  `$context->currentOrFail()` instead of `tenant()` facade.
- `HostResolver` — decides whether the request landed on the central
  admin plane, a tenant subdomain, or a custom apex domain.
- `ProvisionTenant` (Actions/Support) — the multi-write orchestrator
  wrapped in `DB::transaction`. Fires `TenantProvisioning` inside the
  tx (for same-commit sub-provisioners — default Organization,
  default Region, default Branch, owner User) and
  `TenantProvisioned` post-commit (for outbound side effects —
  welcome email, DNS setup, index build).

### Actions (platform tier)

- `CreateTenant` (POST `/api/v1/platform/tenants`) —
  platform-admin-only path. Delegates to `ProvisionTenant`.
  `RequirePermission(TenancyPermission::Manage)`.
- `ShowTenant`, `ListTenants`, `UpdateTenant`, `DeleteTenant`,
  `SuspendTenant`, `ResumeTenant`, `ArchiveTenant` —
  platform-admin CRUD + lifecycle.

### Actions (contacts)

- Full CRUD on `TenantContact` via `Actions/Contacts/*` (list,
  create, show, update, delete).

### Events

- `TenantProvisioning` (in-tx, sync) — downstream sub-provisioners.
- `TenantProvisioned` (post-commit) — outbound side effects.
- `TenantSuspended`, `TenantResumed`, `TenantArchived` — lifecycle
  broadcasts.

### Exceptions

- `SlugTakenException` — 409 when `(application_id, slug)` already
  exists.

## What's pending

### Actions to complete

- `ScheduleTenantDeletion` (POST `/{tenant}/schedule-deletion`) —
  GDPR-mandated 30-day grace. Sets `deletion_scheduled_at =
  now()->addDays(30)` + fires `TenantDeletionScheduled`. Consumer:
  the finalizer job that runs on the schedule.
- `CancelTenantDeletion` (POST `/{tenant}/cancel-deletion`) —
  restores `deletion_scheduled_at = null` if still within grace.
- `ListMyTenants` (GET `/api/v1/tenants/mine`) — the central-plane
  workspace picker. Returns every tenant the caller's Identity has a
  `TenantMember` row on. Scoped to identity, not tenant.
- `SwitchTenant` (POST `/api/v1/tenants/switch`) — session-level
  tenant context switch. Emits a new Sanctum PAT scoped to the target
  tenant + revokes the old one. Blocks if the caller lacks
  membership.
- Tenant-facing self-service `ShowMyTenant` (GET `/api/v1/tenant`) —
  returns the currently-resolved tenant's public payload.

### Support services to complete

- `TenantOnboardingProgress` (Actions/Support) — computes
  `progress_percent` from the checklist (has_owner + has_branch +
  has_first_member + has_billing + has_first_athlete_or_customer +
  ...). Consumers: the tenant-admin dashboard, the "getting started"
  slide-over.
- `TenantFinalizerJob` — the queued job that runs when
  `deletion_scheduled_at < now()`. Executes the actual GDPR erasure:
  delete tenant + cascade every scoped table + zero-fill in
  cross-tenant audit records + fire `TenantErased`.
- `EnsureUniqueSlug` (Actions/Support) — hand a name, returns a
  URL-safe slug that is unique on `(application_id, slug)`. Handles
  collision auto-suffix (`acme`, `acme-2`, `acme-3`).

### Migrations to add

- `deletion_scheduled_at TIMESTAMP NULL` on `tenants` — for the grace
  period. Blueprint update at
  `modules/platform/blueprints/tenancy/schemas/tenant.schema.json`
  MUST precede.
- Index on `(deletion_scheduled_at)` for the finalizer job scan.

### Domain events to dispatch

Per `modules/platform/blueprints/tenancy/events.json`:

- `TenantDeletionScheduled` / `TenantDeletionCancelled` /
  `TenantErased` — deferred with `ScheduleTenantDeletion` /
  `CancelTenantDeletion` / `TenantFinalizerJob`.
- `TenantContextSwitched` — deferred with `SwitchTenant`.

### Cross-module dependencies

- **`platform/organization`** — `TenantProvisioning` listener creates
  the default Organization (`is_default: true`, name = tenant name).
- **`platform/region`** — same, creates default Region.
- **`platform/branch`** — same, creates default Branch.
- **`identity/user`** — same, creates the owner User row from the
  provisioning payload's `owner_email`.
- **`access/rbac`** — same, seeds the platform-default role catalogue
  for the tenant's `business_type`.
- **`billing/subscription`** — same, provisions a `trialing`
  subscription row on the free plan.

These are all listeners on `TenantProvisioning`; they piggy-back on
the same transaction so provisioning is atomic.

## Backlog priorities

1. **P0 — Deletion grace flow** (schedule + cancel + finalizer +
   migration). Blocking GDPR compliance.
2. **P0 — Workspace picker** (`ListMyTenants` + `SwitchTenant`).
   Blocking the frontend workspace switcher.
3. **P1 — Onboarding progress computation.**
4. **P2 — Slug helper + collision handling.**
