# geofencing — changelog

## [Unreleased] — inception

- Geofencing module authored. Shared point-in-polygon primitive for check-in / clock-in features.
- One entity: `GeofenceCheck` (immutable, insert-only, `gfc_` prefix).
- `GeofenceService::evaluate()` — persists exactly one row + fires `GeofenceEvaluated`.
- `GeofenceService::healthCheck()` — mobile pre-flight, no persistence.
- Polygon + radius modes with accuracy-tolerance short-circuit + fail-closed ERROR path.
- Override flow via approval tasks: `GeofenceOverrideRequested` → approval → new `INSIDE` row with `supersedes_check_id`.
- PostGIS extension migration (single-database row-level workspaces).
- 5 Spatie Health probes: PostGIS available, checks table writable, recent activity, override rate, aggregate.
- Frozen v1 event contract at `contracts/geofence-evaluated.v1.json`.

### Compatibility

- Depends on `foundation`, `workspaces`, `activity`, `audit`, `entitlements`.
- Optional consumer of `facilities` (branch geometry), `geography` (address normalisation), `notifications` (override alerts).
- Inception release.
