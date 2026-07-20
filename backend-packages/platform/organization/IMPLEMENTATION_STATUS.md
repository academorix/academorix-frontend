# platform/organization — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD actions pending

## What landed

- `Organization` model + `OrganizationInterface` — the structural
  sub-brand. Carries `tenant_id`, `parent_id` (self-referential
  nesting — Enterprise tier only, see the hierarchy tier matrix),
  `slug`, `name`, `logo_url`, `brand_color`, `is_default`.

## What's pending

### Actions to complete

- Full CRUD — `CreateOrganization`, `UpdateOrganization`,
  `ShowOrganization`, `ListOrganizations`, `DeleteOrganization`.
- `SetDefaultOrganization` — one org per tenant is the "default" —
  used as the fallback for branches + teams.
- `MoveOrganization` (POST `/{organization}/move`) — reparent an
  Organization to a new `parent_id`. Refused when the target parent
  would create a cycle. Refused when the tenant lacks
  `organization_hierarchy` entitlement (Enterprise tier only).

### Services

- `TenantDefaultOrganizationProvisioner` — listens to
  `TenantProvisioning` (from `platform/tenancy`) and creates the
  default organization atomically. `is_default: true`,
  `name = tenant.name`.
- `OrganizationHierarchyValidator` — refuses hierarchy moves that
  would create a cycle. Refuses cross-application parents (Sports
  Org cannot parent a Marketplace Org). Refuses when entitlement
  is not granted.

### Domain events

- `OrganizationCreated`, `OrganizationUpdated`,
  `OrganizationArchived`, `OrganizationDefaultChanged`,
  `OrganizationMoved`.

### Cross-module dependencies

- **`platform/tenancy`** — default-organization provisioner.
- **`platform/branch`** — Branch.organization_id references
  Organization.
- **`sports/teams`** — Team.organization_id references Organization.
- **`billing/entitlements`** — checks `organization_hierarchy` +
  `organization_slot` entitlements on write paths.

## Backlog priorities

1. **P0 — Full CRUD** (unblocks tenant onboarding).
2. **P0 — Default-organization provisioner** (blocks tenant
   provisioning completion).
3. **P1 — Hierarchy validator** (Enterprise entitlement gate).
4. **P2 — Reparenting flow with entitlement check.**
