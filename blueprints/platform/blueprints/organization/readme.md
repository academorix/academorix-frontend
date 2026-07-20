# organization

Structural sub-brand aggregate belonging to a Tenant. Wave 2 infrastructure —
lands alongside `region` and before `branch` because Branch carries FKs to both.
This module answers the question "which brand does this row belong to?" and
NOTHING else — regulatory concerns live on `region`, physical location on
`branch`.

## 1. What this module owns

| Concern                         | Owned artefact                                                              |
| ------------------------------- | --------------------------------------------------------------------------- |
| Structural aggregate            | `Organization` (name, slug, branding hints, category, status, is_default)   |
| Hierarchy                       | `parent_id` self-FK + materialised `tree_path` + `tree_depth`               |
| Default-org invariant           | Exactly one `is_default=true` per tenant, seeded on `TenantProvisioned`     |
| Traits                          | `BelongsToOrganization`, `HasOrganizationHierarchy`                         |
| Middleware                      | `organization.resolve_active` (reads `X-Organization-Id` or user's default) |
| Events                          | Ten lifecycle events (created, reparented, default-changed, archived, …)    |
| CRUD surface                    | Tenant + platform-admin planes                                              |
| Cycle detection + depth capping | Enforced by `OrganizationObserver` + `parent_no_cycle` rule                 |

## 2. The three orthogonal axes below Tenant

Per `.kiro/steering/hierarchy.md` §2, three axes hang off Tenant:

- **Organization** — structural sub-brand. Owned by this module.
- **Region** — commercial/regulatory zone. Owned by `region`.
- **Users** — identity. Owned by `user`.

Organization and Region are **orthogonal** — they meet at `Branch` which carries
FKs to both. A tenant running "Elite Sports" in the UK and Canada has one
Organization (Elite Sports) and two Regions (UK, CA), meeting at two Branches
(one Elite Sports branch per Region). A tenant running "Elite Sports" and
"Community Sports" in the UK has two Organizations and one Region, meeting at
two Branches.

**Never** add `region_id` to `organizations` (or vice versa). The join point is
always Branch. Enforced by
[`tenancy-columns.md`](../../../../.kiro/steering/tenancy-columns.md) §5.

## 3. Tier-gated capabilities

Per hierarchy.md §7 tier matrix:

| Tier       | Organizations           | Nesting           |
| ---------- | ----------------------- | ----------------- |
| Small      | 1 (the default, locked) | no                |
| Medium     | up to 5                 | no                |
| Enterprise | unlimited               | yes (`parent_id`) |

Nesting requires the `organization_hierarchy` boolean entitlement. Slot
enforcement runs via `organization_slot` consumed in
`OrganizationObserver::creating` (see `entitlements.json`).

## 4. Default-organization invariant

Every Tenant provisions exactly ONE `is_default=true` Organization at
`TenantProvisioned` time. This means single-brand tenants never have to
special-case "does an Organization exist?" — downstream code always finds one.

Enforcement:

- `SeedDefaultOrganizationForTenantJob` listens on `TenantProvisioned` and
  creates a row named after the tenant (`name = tenant.name`,
  `slug = 'default'`, `is_default = true`, `parent_id = null`,
  `category = <inferred from tenant.business_type>`).
- Flipping `is_default = true` on another row auto-demotes the previous default
  inside the same DB transaction (`OrganizationObserver::saving`).
- Deleting the default is refused (`ORGANIZATION_IS_DEFAULT` 409).
- Archiving the default is refused (`ORGANIZATION_IS_DEFAULT` 409).
- A nightly `ReconcileDefaultOrganizationInvariantJob` sweeps and repairs drift
  (zero or two-plus defaults per tenant) — a compliance-critical alert triggers
  when drift is found.

## 5. Materialised tree_path

Nested Organizations use a **materialised path** (`.<id-a>.<id-b>.<id-c>.`) for
O(1) descendant lookup, not a recursive CTE. Reasoning:

- Descendant-lookup is a HOT path (invoked in every scoped policy decision).
- A recursive CTE costs ~ms per lookup; a `LIKE '.a.b.%'` prefix scan on a BTREE
  index costs ~µs.
- The path stays consistent because ONLY `parent_id` changes it — every write
  goes through `OrganizationObserver::saving parent_id` which rebuilds the path
  in the same transaction.

Path format: leading dot + ULID-per-node + separating dots + trailing dot.
Example: `.org_01H0000ROOT.org_01H1111CHILD.org_01H2222GRAND.`.

The trailing dot lets `LIKE '.a.'` match exactly the node itself and
`LIKE '.a.%'` match the node plus every descendant.

Reparenting fires `OrganizationParentChanged` + dispatches `RebuildTreePathsJob`
for the moved subtree (self + every descendant). The job walks BFS through
descendants, updating each row's `tree_path` + `tree_depth` in one write. See
`jobs.json` for the sequencing.

## 6. Branding integration

The `organization_branding` entitlement (Medium+) lets a tenant give each
Organization its own branding — logo, primary/secondary colors, description.
When the entitlement is OFF, columns are readable but writes to
`logo_url`/`primary_color`/`secondary_color` are refused
(`ORGANIZATION_BRANDING_NOT_ENTITLED` 402). Frontend renders the tenant's
default branding.

The Branding module (planned) reads `organization_id` on its `Branding` row and
cascades through this module's org for hierarchy inheritance.

## 7. Column contract (per tenancy-columns.md §3)

`organizations` carries `tenant_id` — the only tenancy column. NEVER
`application_id` (cascades through `tenants.application_id`, per
tenancy-columns.md §2). NEVER `region_id` (orthogonal axis). NEVER
`scope_node_id` (Organization is a scope-node **entity**, not a
scope-**consumer**).

See `schemas/organization.schema.json` for the full column list.

## 8. What this module does NOT do

- **Doesn't own Region.** That's `region`.
- **Doesn't own Branch or Facility.** Those are `branch` + `facility` which BOTH
  FK to `organizations.id` via Branch.
- **Doesn't own physical addresses.** Physical location lives on `Branch`.
- **Doesn't own contact info at the tenant level.** Tenant-wide contacts live on
  `TenantContact` in `tenancy`. Organization-level contact fields
  (support_email, support_phone, contact_person_name) are the Organization's
  own, distinct from the tenant's.
- **Doesn't own currency / tax / VAT.** Those are `region` concerns.
- **Doesn't own DAG-shaped hierarchies.** A node has AT MOST ONE parent;
  multiple-inheritance is refused. Callers who need a DAG must model the second
  edge via a different relationship (e.g. a Team membership across multiple
  Organizations).

## 9. Retention

- Active + paused Organizations: never expire.
- Archived Organizations: 730-day hold, then hard-delete IF no descendants and
  no `branches` reference. Enforced by `PurgeArchivedOrganizationsJob`.
- Hard-deleting the default is impossible (rule + observer + DB guard).

## 10. Compliance

- **SOC 2 CC6.3** — every reparent event carries `tree_path.before` +
  `tree_path.after` and hits the audit log. Reparenting reveals organizational
  restructuring so the audit row is critical-severity.
- **GDPR Art. 17** — `tenancy::TenantErased` cascades hard-delete via FK.

## 11. Migration notes

Landing this module requires the `application` module (priority 40) and
`entitlements` module (priority ~50) to have booted. Every FK to
`organizations.id` (branches, teams, and future facility/season aggregates) is
`ON DELETE RESTRICT` — the parent Organization can only be deleted after its
descendants have been reparented + its Branches archived.

## 12. Related steering

- `.kiro/steering/hierarchy.md` — §2 the platform tree, §7 tier matrix, §13
  non-goals.
- `.kiro/steering/tenancy-columns.md` — §3 tenant_id contract, §5 forbidden
  columns.
- `.kiro/hooks/tenancy-columns-check.json` — save-time reminder.
