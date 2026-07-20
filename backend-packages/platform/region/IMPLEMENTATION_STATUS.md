# platform/region — Phase 3 implementation status

## Status: SCAFFOLDED — model + interface landed; CRUD actions pending

## What landed

- `Region` model + `RegionInterface` — the commercial zone.
  Carries `tenant_id`, `slug`, `name`, `currency`, `country_code`,
  `timezone`, `tax_jurisdiction`, `is_default`.

## What's pending

### Actions to complete

- Full CRUD — `CreateRegion`, `UpdateRegion`, `ShowRegion`,
  `ListRegions`, `DeleteRegion`.
- `SetDefaultRegion` — one region per tenant is the "default" — 
  used as the fallback for branches + billing rows.

### Services

- `TenantDefaultRegionProvisioner` — listens to
  `TenantProvisioning` (from `platform/tenancy`) and creates the
  default region atomically. Reads the tenant's `country_code` +
  seeds the matching region template (USD/USA, EUR/DEU, GBP/GBR).

### Domain events

- `RegionCreated`, `RegionUpdated`, `RegionArchived`,
  `RegionDefaultChanged`.

### Cross-module dependencies

- **`platform/tenancy`** — default-region provisioner.
- **`platform/branch`** — Branch.region_id references Region.
- **`finance/tax`** — tax rules keyed by
  `region.tax_jurisdiction`.
- **`finance/payment`** — currency conversion + gateway selection
  keyed by `region.currency`.

## Backlog priorities

1. **P0 — Full CRUD** (unblocks tenant onboarding).
2. **P0 — Default-region provisioner** (blocks tenant provisioning
   completion).
3. **P1 — Region-template seeder** (US, EU, GB, AU defaults).
