# geofencing — changelog

## [Unreleased] — inception

- Geofencing module authored. **Model-agnostic** point-in-polygon primitive
  \u2014 any Eloquent model can carry a fence via the `HasGeofence` trait +
  `#[Geofenceable]` attribute.
- One entity: `GeofenceCheck` (immutable, insert-only, `gfc_` prefix). Two
  polymorphic pairs: `subject_type/subject_id` for the caller +
  `fenceable_type/fenceable_id` for the fenced entity.
- `GeofenceService::evaluate($fenceable, $data)` \u2014 persists exactly one
  row + fires `GeofenceEvaluated`.
- `GeofenceService::healthCheck($fenceable, $data)` \u2014 mobile pre-flight, no
  persistence.
- `Blueprint::addGeofenceColumns()` macro for consumer migrations to add the 7
  standard fence columns.
- Polygon + radius modes with accuracy-tolerance short-circuit + fail-closed
  ERROR path.
- Override flow via approval tasks: `GeofenceOverrideRequested` \u2192 approval
  \u2192 new `INSIDE` row with `supersedes_check_id`.
- PostGIS extension migration (single-database row-level tenants).
- 5 Spatie Health probes.
- Frozen v1 event contract at `contracts/geofence-evaluated.v1.json` with
  polymorphic fenceable payload.

### Design change from initial draft

Earlier draft coupled the module to a `Branch` entity via a nullable `branch_id`
FK on `geofence_checks`. That path was abandoned before release in favour of the
polymorphic `fenceable_type/fenceable_id` shape so the module works with any
host model \u2014 branches, facilities, venues, events, delivery zones, home
addresses \u2014 without a Facilities dependency. No consumers exist yet at
inception, so no migration path is needed.

### Compatibility

- Depends on `foundation`, `tenants`, `activity`, `audit`, `entitlements`.
- Optional consumer of `geography` (address normalisation), `notifications`
  (override alerts).
- Inception release.
