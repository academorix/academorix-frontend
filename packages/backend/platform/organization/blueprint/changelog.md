# organization — changelog

## [Unreleased] — inception

- **Organization aggregate authored.** One entity: `Organization` with 25
  columns covering identity (slug, name, short_name, description), hierarchy
  (`parent_id`, materialised `tree_path`, `tree_depth`), branding (logo_url,
  primary_color, secondary_color), contact (support_email, support_phone,
  contact_person_name, website_url), category + status + `is_default` invariant,
  and audit-plus-timestamps.
- **Tenancy column contract** — carries `tenant_id` only. NO `application_id`
  (cascades through `tenants.application_id` per `tenancy-columns.md` §2). NO
  `region_id` (orthogonal per `hierarchy.md` §2). NO `scope_node_id`
  (Organization is a scope-node entity, not a scope consumer).
- **Default-org invariant** — exactly one `is_default=true` per tenant, seeded
  by `SeedDefaultOrganizationForTenantJob` on `tenancy::TenantProvisioned`.
  Auto-demotes on default flip in the same DB transaction. Nightly
  reconciliation job `ReconcileDefaultOrganizationInvariantJob` sweeps drift.
- **Materialised tree_path** — `.<ancestor>.<parent>.<self>.` sentinel-wrapped
  format for O(1) descendant queries on BTREE-indexed LIKE prefix scans.
  Trailing dot lets `LIKE '.a.'` match self, `LIKE '.a.%'` match self +
  descendants. Rebuilt in-transaction on parent_id changes for the moved node;
  BFS-async for the subtree via `RebuildTreePathsJob`.
- **Cycle detection** — `CycleDetector` walks the proposed parent's ancestor
  chain looking for the current node; `parent_no_cycle` validation rule surfaces
  the error inline in FormRequests.
- **Depth capping** — configurable `organization.hierarchy.max_depth`
  (default 5) enforced by `parent_within_depth_cap` rule + observer.
- **Same-tenant enforcement** — `parent_same_tenant` rule refuses cross-tenant
  parent_id chains (belt-and-braces beyond the FK).
- **Entitlement gating** — `organization_slot` slot consumed on create /
  released on delete; `organization_hierarchy` boolean gates parent_id;
  `organization_branding` boolean gates branding columns;
  `organization_reparent` boolean gates the `POST /reparent` endpoint on
  post-create moves.
- **Ten lifecycle events** — Created, Updated, StatusChanged, ParentChanged,
  DefaultChanged, BrandingUpdated, Archived, Restored, Deleted, and
  TenantDefaultOrganizationSeeded. All ShouldDispatchAfterCommit.
- **HTTP surface** — tenant-plane CRUD + reparent / set-default / pause / resume
  / archive / tree; platform-plane cross-tenant observability.
- **Compliance** — SOC 2 CC6.3 audit row on every reparent (`tree_path.before`
  - `tree_path.after` in the diff).
- **Retention** — active + paused rows never expire; archived rows hard-purge
  after 730 days IF no descendants + no branch references.

### Compatibility

- Depends on `foundation`, `tenancy`, `application`, `entitlements`.
- Extended by `branch`, `teams`.
- Inception release — no prior schema to migrate.
