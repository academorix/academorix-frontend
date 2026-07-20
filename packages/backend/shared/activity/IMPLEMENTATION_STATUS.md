# shared/activity — Phase 3 implementation status

## Status: SUBSTANTIALLY DONE — tenant_id gap closed, models + repositories + core Actions in place; DSAR export + settings integration pending

## What landed

### Tenancy-columns §9 P0 gap CLOSED

Migration `2026_07_15_000090_add_tenant_id_to_activity_log_table.php`
adds `tenant_id UUID NULL` to spatie's `activity_log` table +
composite index `(tenant_id, created_at)` for the primary read
path.

### Model

- **`Activity`** — extends `Spatie\Activitylog\Models\Activity`,
  composes `BelongsToTenant` (auto-fills `tenant_id` on save,
  scopes reads to the active tenant), `HasPrefixedUlid` (primary
  key becomes `act_<ulid>` — overrides spatie's bigint), `Auditable`
  (owen-it), `HasMetadata`.
- Explicit `$fillable` covering spatie's own list + `tenant_id`.
- `getTable()` reads from `config('activity.table_name')` so
  downstream apps can rename the table.

### Repository

- **`EloquentActivityRepository`** — via `#[AsRepository]` on the
  concrete + `#[UseModel(ActivityInterface::class)]`. CRUD from
  the base.

### Attributes

- **`LoggableActivity`** — marker attribute for models that
  should log activity. Composed via `LogsActivity` from spatie.

### Actions

- **`Tenant/ListActivities`** — tenant DPO read of own-tenant
  activity feed. Scoped by `BelongsToTenant`.
- **`Tenant/ShowActivity`** — single activity row.
- **`Platform/ListActivities`** — cross-tenant read (platform
  guard).
- **`Platform/ShowActivity`** — single row (platform guard).

### Services

- **`ActivityLoggerInterface`** — the write-facing contract.
  Bound to a concrete that wraps spatie's `activity()` builder
  with our `tenant_id` + `LoggableActivity` discipline.

## What's pending

### Actions to complete

- **`Tenant/ExportActivityAction`** — GET `/activities/export`.
  CSV export for the tenant DPO surface (routes through
  `shared/transfer::StartExportAction`).
- **`Platform/ExportActivityAction`** — GET
  `/platform/activities/export`. Cross-tenant for compliance
  officers.
- **`FeedAction`** — GET `/activities/feed`. Cursor-paginated
  reverse-chronological feed for user-facing surfaces (e.g. an
  athlete's parent seeing recent training-attendance updates).
  Different from the DPO read — smaller field set (no PII beyond
  the causer's display name).

### Services + registry

- **`ActivityRegistry`** — currently just a scaffold under
  `Registry/`. Needs to consume `#[LoggableActivity]` from every
  model that composes `LogsActivity` and register the log-name
  + retention policy per subject.
- **`ActivityFeedFilter`** — the per-audience filter that hides
  activity from users who shouldn't see it (e.g. a coach
  shouldn't see another coach's private notes).

### Jobs

- **`PruneActivityLogJob`** — cron: daily. Reads the retention
  tier from the active `Subscription` per Application and
  prunes rows past the window (small: 30 days; medium: 90 days;
  enterprise: 365 days).

### Cross-module dependencies

- **`compliance/retention`** — retention windows.
- **`shared/transfer`** — CSV export.
- **`identity/user`** — the `causer` FK.
- **Every domain module** — models compose `LogsActivity` +
  `#[LoggableActivity]` to opt into the timeline.

## Backlog priorities

1. **P1 — `PruneActivityLogJob`** — compliance-critical for
   retention-tier compliance.
2. **P1 — `ExportActivityAction` (both surfaces)** — DPO surface
   gap.
3. **P2 — `FeedAction`** — end-user feed rendering.
4. **P2 — `ActivityFeedFilter`** — the per-audience narrowing.

**Note:** the tenancy-columns.md §9 gap is CLOSED. This module
went from a P0-gap to substantially-done in the trust-boundary
batch.
