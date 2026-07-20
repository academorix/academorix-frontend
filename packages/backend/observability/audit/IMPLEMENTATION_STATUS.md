# observability/audit — Phase 3 implementation status

## Status: SCAFFOLDED — vendor `owen-it/laravel-auditing` wired; `tenant_id` schema gap open

## What landed

- Read-only surface over the vendor `owen-it/laravel-auditing`
  `audits` table. Every model composes `Auditable` (owen-it's
  trait + contract) to write immutable field-level diffs on every
  mutation.
- Retention scheduler stub — the tier matrix says Small=90d,
  Medium=1y, Enterprise=7y+. The nightly `PruneAuditLogsCommand`
  reads `Subscription.plan.audit_retention_days` and deletes rows
  older than the window.

## What's pending

### Actions to complete

- `ListAudits` (GET `/api/v1/tenant/audits`) — tenant admin
  surface. Filters by `auditable_type`, `auditable_id`, `user_id`,
  `event`, `created_at` range. Paginated.
- `ExportAudits` (POST `/api/v1/tenant/audits/export`) — DSAR CSV
  export. Consumer: `compliance/compliance` DSAR path. Streams via
  `SymfonyCsv` writer + returns a `platform/storage` signed URL.
- `ShowAudit` (GET `/{audit}`) — single-audit view with diff
  rendering.

### Schema gap — `tenant_id` column

Per `.kiro/steering/tenancy-columns.md` §3, the vendor `audits`
table ships WITHOUT a `tenant_id` column — compliance queries
currently extract tenant id from the `new_values` JSON blob, which
prevents indexing. **Action:**

1. Add migration
   `2026_XX_XX_XXXXXX_add_tenant_id_to_audits.php` that adds
   `tenant_id UUID NULL, INDEX(tenant_id, created_at)`.
2. Apply `BelongsToTenant` trait on the module's `Audit` model.
3. Backfill from `new_values.tenant_id` for existing rows.

Priority: P0 (per the steering doc's living gap register).

### Cross-module dependencies

- Every module that composes `Auditable` on its models writes
  here — no direct dependency in the other direction.
- **`compliance/compliance`** — DSAR + retention consumer.
- **`platform/tenancy`** — per-tenant retention window read from
  the plan.

## Backlog priorities

1. **P0 — Add `tenant_id` column to audits** (living gap
   register).
2. **P0 — Retention scheduler wiring.**
3. **P1 — Tenant admin read surface** (List + Show + Export).
