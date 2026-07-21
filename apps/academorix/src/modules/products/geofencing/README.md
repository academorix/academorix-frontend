# `stackra/geofencing`

Model-agnostic point-in-polygon primitive. Any Eloquent model can carry a
geofence by using the `HasGeofence` trait + declaring itself with the
`#[Geofenceable]` attribute — no hard-wired coupling to Branch or any other
entity.

## What it owns

- **`GeofenceCheck` aggregate** — immutable evaluation audit log (`gfc_`
  prefix). Two polymorphic pointers: `subject_type` / `subject_id` (WHY the
  check ran) + `fenceable_type` / `fenceable_id` (WHAT it ran against).
- **`HasGeofence` trait** — mixed into any Eloquent model. Adds geometry column
  casts, a `geofenceChecks()` `MorphMany` relation, and the `evaluateGeofence()`
  / `preflightGeofence()` helpers.
- **`Geofenceable` contract** — stable surface the evaluator depends on. Every
  fenceable model implements it; the trait provides the default column-backed
  implementation.
- **`GeofenceService`** — the polygon + radius evaluator. Delegates polygon math
  to `PolygonEvaluator` (which delegates to `spinen/laravel-geometry` in
  production, hand-rolled ray-cast + haversine in tests).
- **`GeofenceOverrideService`** — request-approve-apply pipeline for manual
  overrides on rejected checks. Overrides are new rows with
  `supersedes_check_id` pointing at the original.
- **Two attributes** — `#[Geofenceable]` for fenceable models,
  `#[GeofenceSubjectAlias]` for caller models. Both discovered at boot;
  duplicate aliases fail startup.
- **Priority 70** — after most tenant-scoped modules; well before consumer
  packages that will subscribe to `GeofenceEvaluated`.

## Non-goals

- Doesn't hardwire to any specific host model. Any model with `HasGeofence`
  works.
- Doesn't read `geofence_enforcement_enabled` toggle. Consumers do.
- Doesn't run migrations for other modules' tables. Only
  `create_geofence_checks_table`. Consumer modules call
  `$table->addGeofenceColumns()` in their own migrations (macro planned).
- Doesn't run approvals. Approvals module does — this module publishes
  `GeofenceOverrideRequested` and reads a repository contract.

## Compliance

- **GDPR Art. 5(1)(e)** — retention window 7 years hot + 3 years cold; hard
  purge at 10 years for non-override rows.
- **GDPR Art. 17** — soft-delete via `SoftDeletes` flows through
  `runSoftDelete()` bypassing the immutability guard so the retention path stays
  open.
- **US FLSA 3y** — `subject_type='staff_clockin'` rows carry longer floor
  retention as wage-and-hour records.
- **Override immutability** — override rows retain for 10 years minimum;
  non-configurable floor.
