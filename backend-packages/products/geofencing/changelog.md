# Changelog

All notable changes to `academorix/geofencing`.

## [Unreleased]

### Added

- Initial scaffolding — enterprise-day-1 shape (attribute-first DI, `#[Bind]` on
  interfaces, `#[UseModel]` + `#[Cacheable]` + `#[Filterable]` on the
  repository, `SeedsPermissionEnum` seeder).
- `GeofenceCheck` model + migration + factory + policy + observer with
  immutability guard.
- `#[Geofenceable]` + `#[GeofenceSubjectAlias]` attributes.
- `HasGeofence` trait + `Geofenceable` contract for model-agnostic fence
  storage.
- `GeofenceService` (evaluator) + `PolygonEvaluator` + `PolygonValidator` +
  `GeofenceOverrideService`.
- Enums: `GeofenceResult`, `GeofenceMode`, `PolygonValidationReason`.
- Actions for preflight + fence read/edit + override request + check log read +
  platform-admin observability.
- Console commands for describe / test-eval / list-aliases / reconcile
  immutability.
- Jobs: `PurgeStaleGeofenceChecksJob`, `ReconcileGeofenceCheckImmutabilityJob`.
