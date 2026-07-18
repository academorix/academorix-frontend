# branch — changelog

## [Unreleased] — inception (Wave 2, priority 45)

- Branch module authored. Single aggregate: `Branch` (`brn_` prefix).
- Three-FK contract: `tenant_id` + `organization_id` + `region_id`. All three
  required, non-nullable. Immutable post-create (per hierarchy.md §13 no-move
  rules).
- Structured address as JSONB (`line1`, `line2`, `city`, `subdivision`,
  `postal_code`, `country_code`, `formatted`). `AddressFormatter` computes
  the `formatted` string per-locale on every save.
- Structured coordinates as JSONB (`lat`, `lng`, `accuracy_m`, `source`).
  No PostGIS in Wave 2 — geometry math lives in the Wave 3 `geofencing`
  module which subscribes to `BranchCoordinatesUpdated`.
- Opening hours as JSONB — 7-day map, per-day array of `{open, close}`
  periods (multi-period days supported on Medium+ via
  `branch_multi_period_hours`), tz-aware `exceptions` list. Every time is
  local to `branch.region.timezone` — never UTC.
- Capacity as nullable int (fire-safety cap). Consumed by downstream booking
  modules via `CapacityGate`; feature-gated by `branch_capacity_gating`
  (Medium+, default off).
- Amenities as JSONB array of platform-catalogue tags
  (`data/amenity-catalog.json`). Custom tags require the
  `branch_amenities: custom` entitlement (Enterprise).
- Operational lifecycle: `active` / `paused` / `closed`. `closed` is
  terminal but reversible via `reopen`. Refused when active downstream rows
  reference the Branch (`BRANCH_IN_USE`, 409).
- Exactly-one-default invariant per `(tenant_id, organization_id)` —
  enforced by partial unique index + `BranchObserver`.
- 13 lifecycle events (see `events.json`). All dispatched `afterCommit`.
- 11 Artisan commands covering CRUD + lifecycle transitions + hours editing
  + re-geocoding + address audit.
- 3 background jobs: `GeocodeAddressJob`,
  `ReconcileDefaultBranchInvariantJob`, `NotifyStaffOfBranchClosureJob`.
- 3 notification categories: `branch.created`, `branch.closed`,
  `branch.opening_hours_changed` — closure is `transactional_required` (no
  opt-out); creation + hours-changed are opt-in.
- `BranchPolicy` — CRUD scoped to owner + admin; read for every tenant
  member; close refused when active dependencies exist.
- `BranchObserver` — enforces every invariant (tenant match on Org + Region,
  slot consumption, is_default flip semantics, immutability of org/region,
  hard-delete refusal, coordinate-change event dispatch).
- Two middleware: `branch.resolve_active` (reads `X-Branch-Id` on tenant
  writes, falls back to caller's default) + `branch.enforce_operating_hours`
  (booking-adjacent routes only).
- 8 validation rules — `valid_e164_phone`, `valid_url`, `valid_hex_color`,
  `valid_opening_hours`, `valid_address_structure`, `valid_coordinates`,
  `branch_organization_same_tenant`, `branch_region_same_tenant`.
- 5 entitlements published: `branch_slot`, `branch_geocoding`,
  `branch_capacity_gating`, `branch_amenities`, `branch_multi_period_hours`.
- 7 feature keys: `branch.core`, `branch.multi_period_hours`,
  `branch.geocoding`, `branch.capacity_gating`, `branch.custom_amenities`,
  `branch.map_view`, `branch.public_directory` (deferred).
- Optional geocoding via 3 subprocessors: Google Maps Geocoding API,
  Mapbox Geocoding, Nominatim (OpenStreetMap). Configurable per tenant via
  `branch.geocoding.provider`. Gated by `branch_geocoding` entitlement.
- Health probes covering FK integrity, invariant integrity (one default per
  org), geocoder reachability (when configured), stuck geocoding jobs.
- ULID prefix reserved: `brn_`. Foundation registry updated in the same
  commit.
- One tenancy hook: `BranchesOnTenantErased` — before-cascade cleanup that
  cancels in-flight `GeocodeAddressJob` for branches on the erased tenant
  (avoids wasted subprocessor spend).
- Cross-tenant read on the platform plane
  (`GET /api/v1/platform/branches[/{branch}]`) for support tooling +
  `POST /api/v1/platform/branches/{branch}/force-close` for the rare
  compliance-forced closure.
- SDUI blueprints for the branch resource — list + create + edit +
  hours-editor + map-view screens + amenity-picker + is-open-chip widgets.

### Compatibility

- Depends on `foundation`, `tenancy`, `organization`, `region`,
  `application`, `entitlements`.
- Extended by `facility`, `teams`, `staff`, `sports` (Wave 3),
  `finance` (Wave 4).
- Wave 3 geofencing module subscribes to `BranchCoordinatesUpdated` events.

### Non-goals for this release

Every non-goal below stays out of this module and is explicitly deferred to a
sibling or a later wave. See `readme.md` §9 for the full list.

- No point-in-polygon math — deferred to `products::geofencing` (Wave 3).
- No booking / session / registration rows — deferred to
  `facility` / `teams` / `sports` (Wave 3+).
- No cross-organization moves — immutable by design.
- No cross-region moves — immutable by design.
- No hard-delete via public API — closed is terminal.
- No mobile / virtual venues — deferred.
- No `is_publicly_listed` toggle for public directory — deferred.
- No per-period capacity — uniform across all opening periods.
