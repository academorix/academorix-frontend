# geofencing

Model-agnostic point-in-polygon primitive. Wave 6 spatial infrastructure.

## 1. What this module owns

| Concern                             | Owned artefact                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| Immutable evaluation audit log      | `GeofenceCheck` (`gfc_` prefix, polymorphic on the fenced entity)                    |
| Model-agnostic fence carrier        | `HasGeofence` trait + `Geofenceable` interface                                       |
| Fence geometry columns macro        | `Blueprint::addGeofenceColumns()`                                                    |
| Point-in-polygon + radius evaluator | `GeofenceService` binding                                                            |
| Polygon geometry math               | `PolygonEvaluator` (delegates to spinen/laravel-geometry, falls back to hand-rolled) |
| Polygon input validation            | `PolygonValidator`                                                                   |
| Override request workflow           | `GeofenceOverrideService` binding                                                    |
| Mobile pre-flight endpoint          | `POST /api/v1/geofence/preflight`                                                    |
| PostGIS extension                   | `enable_postgis_extension` migration on the central DB                               |

## 2. Model-agnostic design

Any Eloquent model can carry a geofence. There is **no hard-wired coupling to
Branch or any other entity**. To make a model fenceable:

**Step 1 — add the trait + attribute:**

```php
use Stackra\Geofencing\Attributes\Geofenceable;
use Stackra\Geofencing\Concerns\HasGeofence;
use Stackra\Geofencing\Contracts\Geofenceable as GeofenceableContract;

#[Geofenceable(alias: 'branch')]
final class Branch extends Model implements GeofenceableContract
{
    use HasGeofence;
    // ...
}
```

The `alias` value is the snake_case string persisted to
`geofence_checks.fenceable_type`. It MUST be unique across the codebase; boot
fails at startup on duplicates.

**Step 2 — add the geometry columns via the blueprint macro:**

```php
Schema::table('branches', function (Blueprint $table): void {
    $table->addGeofenceColumns();
});
```

The macro adds seven columns:

| Column                          | Type                                | Description                                         |
| ------------------------------- | ----------------------------------- | --------------------------------------------------- |
| `geofence_polygon`              | `geography(polygon, 4326)` nullable | The fence, drawn as a simple polygon                |
| `location_point`                | `geography(point, 4326)` nullable   | Centroid for radius-mode fallback                   |
| `geofence_radius_m`             | `int unsigned` nullable             | Radius (meters) for radius mode                     |
| `geofence_accuracy_tolerance_m` | `smallint unsigned` default 50      | Reject GPS noisier than this                        |
| `geofence_enforcement_enabled`  | `boolean` default false             | Consumer-facing "should we block on OUTSIDE" toggle |
| `geofence_updated_at`           | `timestamptz` nullable              | When the fence was last edited                      |
| `geofence_updated_by`           | `string(64)` nullable               | Last editor's user ULID                             |

**Step 3 — call the evaluator:**

Two equivalent forms. Both take **any** `Geofenceable` model:

```php
// Via the model helper on the trait
$result = $branch->evaluateGeofence(new EvaluateGeofenceData(
    lat: 40.7128, lng: -74.0060, accuracyM: 25,
    subjectType: 'staff_clockin', subjectId: $clockInId,
));

// Or via the service directly
$result = app(GeofenceService::class)->evaluate($branch, new EvaluateGeofenceData(...));
```

## 3. Two distinct morph pairs on every check row

`GeofenceCheck` carries **two** polymorphic pointers:

| Morph pair                        | Meaning                                                 | Example                           |
| --------------------------------- | ------------------------------------------------------- | --------------------------------- |
| `subject_type` / `subject_id`     | **Why** the evaluation ran (the caller's entity)        | `staff_clockin` / `sci_01HXYZ...` |
| `fenceable_type` / `fenceable_id` | **What** the evaluation ran against (the fenced entity) | `branch` / `brn_01HXYZ...`        |

Consumers register aliases for both — `#[GeofenceSubjectAlias]` on the subject
class, `#[Geofenceable]` on the fenceable class. The evaluator refuses
evaluation for either alias when it's not registered (unless
`geofencing.morph_map.strict = false`).

## 4. Package stack (locked)

- **`clickbar/laravel-magellan`** — Postgres/PostGIS spatial column types on
  Eloquent models.
- **`spinen/laravel-geometry`** — runtime geometry math (point-in-polygon,
  distance) wrapping geoPHP.
- **PostGIS extension** — required. Enabled by `enable_postgis_extension.php`
  migration.

## 5. Decision tree (design §4)

Both entry points (`evaluate()` + `healthCheck()`) share one decision tree:

1. **Cross-tenant assertion** — resolves the fenceable via the polymorphic
   `fenceable_type` morph map, scoped to the current tenant. Returns `null` for
   either "unknown fenceable" or "belongs to another tenant" (collapsed to shut
   down the enumeration attack the design flags).
2. **Accuracy tolerance short-circuit** — if
   `accuracyM > fenceable.geofence_accuracy_tolerance_m`, return `SKIPPED`.
3. **Polygon branch** — if fenceable has `geofence_polygon`: point-in-polygon +
   distance-to-polygon via `PolygonEvaluator`.
4. **Radius fallback** — otherwise: haversine against
   `fenceable.location_point`, compared to `fenceable.geofence_radius_m`.

All four leaves produce a `GeofenceCheck` row (except `healthCheck()` which
never persists).

## 6. Result enum

| Case      | Blocks by default     | Meaning                                              |
| --------- | --------------------- | ---------------------------------------------------- |
| `INSIDE`  | No                    | Reported location falls inside the fence             |
| `OUTSIDE` | **Yes**               | Reported location is outside                         |
| `SKIPPED` | No                    | Accuracy > tolerance; evaluator refused to guess     |
| `ERROR`   | **Yes** (fail-closed) | Cross-tenant, missing geometry, unexpected exception |

The evaluator **does not read `fenceable.geofence_enforcement_enabled`** — that
toggle lives on the consuming feature. This module always records the truth on
the audit log; consumers decide whether to block.

## 7. Immutability

`GeofenceCheck` rows are **insert-only in application code**. The `saving` boot
hook throws `RuntimeException` on any update. Overrides are modelled as a
**new** row whose `supersedes_check_id` points at the original — the original
evaluation is preserved verbatim for compliance reviews and disputed clock-ins.

Soft-delete flows through `runSoftDelete()` which does not fire `saving`, so the
GDPR retention path stays open.

## 8. Override flow (design §5)

When a consumer receives `OUTSIDE` (or `SKIPPED`, or `ERROR`) and the subject
asks for manual override:

```php
$overrideTaskId = app(GeofenceOverrideService::class)->requestOverride(
    originalCheckId: $originalGfcId,
    requesterUserId: auth()->id(),
    reason: 'GPS was drifting; I was inside the building',
);
```

- Reason must be ≥ 10 characters (else `InvalidArgumentException`).
- Creates an `approval_tasks` row (via the abstract `ApprovalTaskRepository` —
  actual implementation lives in the Approvals module).
- Fires `GeofenceOverrideRequested`.

When an admin approves, `ApplyGeofenceOverrideOnApproval` listener mints a
**new** `GeofenceCheck` row with `result=INSIDE`,
`supersedes_check_id=<original>`, `overridden_by_user_id=<admin>`,
`override_reason=<from task>`, and fires `GeofenceOverrideApplied`. The new row
keeps the ORIGINAL row's `fenceable_type` + `fenceable_id` unchanged.

## 9. `subject_type` — polymorphic morph alias for the caller

`geofence_checks.subject_type` is a **snake_case morph alias**, not a class
name. Consuming modules register their alias via `#[GeofenceSubjectAlias]` or
explicit `Relation::enforceMorphMap()`:

```php
#[GeofenceSubjectAlias(alias: 'staff_clockin')]
final class StaffClockIn extends Model { ... }
```

Aliases in use: `staff_clockin`, `attendance`, `attendance_submission`,
`reception_visit` (all future).

## 10. `fenceable_type` — polymorphic morph alias for the fenced entity

`geofence_checks.fenceable_type` is the **snake_case morph alias** of the
fenceable model, registered via `#[Geofenceable]`:

```php
#[Geofenceable(alias: 'branch')]
final class Branch extends Model implements Geofenceable { use HasGeofence; }

#[Geofenceable(alias: 'facility')]
final class Facility extends Model implements Geofenceable { use HasGeofence; }

#[Geofenceable(alias: 'venue')]
final class Venue extends Model implements Geofenceable { use HasGeofence; }
```

Any downstream module can add a new fenceable without touching this module.

## 11. Preflight

`POST /api/v1/geofence/preflight` runs the same decision tree without
persistence. Body carries the fenceable ref + subject ref + location:

```json
{
  "fenceable_type": "branch",
  "fenceable_id": "brn_01HXYZ...",
  "lat": 40.7128,
  "lng": -74.006,
  "accuracy_m": 25,
  "subject_type": "staff_clockin",
  "subject_id": "sci_01HXYZ..."
}
```

Returns the same DTO with `checkId: null`. Rate-limited to `60 req/min` per
authenticated user. Emits a structured `geofence.health_check` log line for
observability.

## 12. Event contract (frozen)

The `GeofenceEvaluated` event ships a locked wire contract at
`contracts/geofence-evaluated.v1.json`. Consumers read `event.check` (the
persisted row) + `event.input` (the originating DTO). Both carry
`fenceable_type` / `fenceable_id` (not `branch_id`).

## 13. Overriding trait storage

The `HasGeofence` trait stores geometry as columns on the model's own table. If
your model's geometry lives elsewhere (e.g., a linked `venues.geometry` table or
a `spatial_features` polymorphic table), implement the `Geofenceable` interface
methods directly:

```php
final class Venue extends Model implements Geofenceable
{
    // No HasGeofence trait \u2014 provide the surface directly.

    public function geofencePolygon(): ?Polygon
    {
        return $this->spatialFeature?->polygon;
    }

    public function locationPoint(): ?Point
    {
        return $this->spatialFeature?->centroid;
    }

    public function geofenceRadiusM(): ?int { ... }
    public function geofenceAccuracyToleranceM(): int { ... }
    public function isGeofenceEnforcementEnabled(): bool { ... }
}
```

The evaluator calls these methods — never reads columns directly — so any
storage strategy works.

## 14. Health probes

Ship five Spatie Health probes: `PostgisAvailableCheck`,
`GeofenceChecksWritableCheck`, `RecentGeofenceActivityCheck`,
`GeofenceOverrideRateCheck`, and the module-wide aggregate
`GeofencingHealthChecks`.

## 15. What this module does NOT do

- **Doesn't hardwire to any specific host model.** Any model with `HasGeofence`
  works.
- **Doesn't read `geofence_enforcement_enabled` toggle.** Consumers do.
- **Doesn't run migrations for other modules' tables.** Only
  `enable_postgis_extension` and `create_geofence_checks_table`. Consumer
  modules call `$table->addGeofenceColumns()` in their own migrations.
- **Doesn't run approvals.** Approvals module does — this module publishes
  `GeofenceOverrideRequested` and reads a repository contract, nothing else.

## 16. Depended on by

`staff-clock-in-out`, `athlete-self-check-in`, `visitor-auto-log`, `attendance`
(all future modules). Plus any future module whose model wants a fence — venues,
courts, home-addresses, delivery-zones, campus-buildings, event-locations.

## 17. Depends on

Foundation, Tenancy, Activity, Audit, Entitlements. Optional: Geography,
Notifications.
