# geofencing

Shared point-in-polygon primitive. Wave 6 spatial infrastructure.

## 1. What this module owns

| Concern                                   | Owned artefact                                                                                                                            |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Immutable evaluation audit log            | `GeofenceCheck` (`gfc_` prefix)                                                                                                           |
| Point-in-polygon + radius evaluator       | `GeofenceService` binding                                                                                                                 |
| Polygon geometry math                     | `PolygonEvaluator` (delegates to spinen/laravel-geometry, falls back to hand-rolled)                                                      |
| Polygon input validation                  | `PolygonValidator`                                                                                                                        |
| Override request workflow                 | `GeofenceOverrideService` binding                                                                                                         |
| Mobile pre-flight endpoint                | `POST /api/v1/geofence/preflight`                                                                                                         |
| Geometry columns on branches / facilities | Migration adds `geofence_polygon`, `location_point`, `geofence_radius_m`, `geofence_accuracy_tolerance_m`, `geofence_enforcement_enabled` |
| PostGIS extension                         | `enable_postgis_extension` migration on the central DB                                                                                    |

## 2. Package stack (locked)

- **`clickbar/laravel-magellan`** — Postgres/PostGIS spatial column types on
  Eloquent models (`POINT`, `POLYGON`, `GEOGRAPHY`).
- **`spinen/laravel-geometry`** — runtime geometry math (point-in-polygon,
  distance) used by the evaluator.
- **PostGIS extension** — required. Enabled by `enable_postgis_extension.php`
  migration.
- No `nnjeim/world` dependency for geometry — that library only provides
  address-normalisation data, never fence math.

## 3. Public evaluator surface

Every check-in feature depends on **one** method:

```php
use Academorix\Geofencing\Data\EvaluateGeofenceData;
use Academorix\Geofencing\Enums\GeofenceResult;
use Academorix\Geofencing\Services\GeofenceService;

final class RecordStaffClockInAction
{
    public function __construct(private readonly GeofenceService $geofence) {}

    public function __invoke(StaffClockInRequest $request): StaffClockIn
    {
        $result = $this->geofence->evaluate(new EvaluateGeofenceData(
            branchId: $request->branchId,
            lat: $request->lat,
            lng: $request->lng,
            accuracyM: $request->accuracyM,
            subjectType: 'staff_clockin',
            subjectId: $request->pendingClockInId,
        ));

        return StaffClockIn::create([
            'geofence_check_id' => $result->checkId,
            'status' => $result->result === GeofenceResult::INSIDE ? 'accepted' : 'rejected',
            // ...
        ]);
    }
}
```

Two entry points:

| Method                           | Persists? | Purpose                                                                                                                          |
| -------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `GeofenceService::evaluate()`    | Yes       | Writes exactly one `geofence_checks` row + fires `GeofenceEvaluated`. Consumer stamps the returned check id on their own entity. |
| `GeofenceService::healthCheck()` | No        | Mobile pre-flight — returns the same DTO with `checkId: null`. Used by `POST /api/v1/geofence/preflight` behind `throttle:60,1`. |

## 4. Decision tree (design §4)

Both entry points share one decision tree:

1. **Cross-workspace assertion** —
   `BranchGeofenceRepository::findForCurrentWorkspace()` returns `null` for
   either "branch doesn't exist" or "belongs to another workspace" (collapsed to
   shut down the enumeration attack the design flags).
2. **Accuracy tolerance short-circuit** — if
   `accuracyM > branch.geofence_accuracy_tolerance_m`, return `SKIPPED` (GPS
   reading too noisy to trust).
3. **Polygon branch** — if branch has `geofence_polygon`: point-in-polygon +
   distance-to-polygon via `PolygonEvaluator`.
4. **Radius fallback** — otherwise: haversine against `branch.location_point`,
   compared to `branch.geofence_radius_m`.

All four leaves produce a `GeofenceCheck` row (except `healthCheck()` which
never persists).

## 5. Result enum

| Case      | Blocks by default     | Meaning                                              |
| --------- | --------------------- | ---------------------------------------------------- |
| `INSIDE`  | No                    | Reported location falls inside the fence             |
| `OUTSIDE` | **Yes**               | Reported location is outside                         |
| `SKIPPED` | No                    | Accuracy > tolerance; evaluator refused to guess     |
| `ERROR`   | **Yes** (fail-closed) | Cross-workspace, missing geometry, unexpected exception |

The evaluator **does not read `branch.geofence_enforcement_enabled`** — that
toggle lives on the consuming feature. This module always records the truth on
the audit log; consumers decide whether to block.

## 6. Immutability

`GeofenceCheck` rows are **insert-only in application code**. The `saving` boot
hook throws `RuntimeException` on any update. Overrides are modelled as a
**new** row whose `supersedes_check_id` points at the original — the original
evaluation is preserved verbatim for compliance reviews and disputed clock-ins.

Soft-delete flows through `runSoftDelete()` which does not fire `saving`, so the
GDPR retention path stays open.

## 7. Override flow (design §5)

When a consumer receives `OUTSIDE` (or `SKIPPED`, or `ERROR`) and the subject
asks for manual override:

```php
use Academorix\Geofencing\Services\GeofenceOverrideService;

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

When an admin approves via the Approvals UI, `ApplyGeofenceOverrideOnApproval`
listener catches the approval event, mints a **new** `GeofenceCheck` row with
`result=INSIDE`, `supersedes_check_id=<original>`,
`overridden_by_user_id=<admin>`, `override_reason=<from task>`, and fires
`GeofenceOverrideApplied`.

## 8. `subject_type` — polymorphic morph alias

`geofence_checks.subject_type` is a **snake_case morph alias**, not a class
name. Consuming modules register their alias in their own
`EventServiceProvider`:

```php
Relation::enforceMorphMap([
    'staff_clockin' => StaffClockIn::class,
    'attendance' => Attendance::class,
    'reception_visit' => ReceptionVisit::class,
]);
```

Aliases in use: `staff_clockin`, `attendance`, `attendance_submission`,
`reception_visit`. The alias flows through `EvaluateGeofenceData.subjectType`
and is echoed on the audit row + the `GeofenceEvaluated` event.

## 9. Preflight

`POST /api/v1/geofence/preflight` runs the same decision tree without
persistence. Returns the same DTO with `checkId: null`. Rate-limited to
`60 req/min` per authenticated user via the standard `throttle:60,1` middleware
— the service itself does not enforce the limit.

Logs one structured `geofence.health_check` line so observability can
distinguish probe traffic from real evaluations.

## 10. Event contract (frozen)

The `GeofenceEvaluated` event ships a locked wire contract at
`contracts/geofence-evaluated.v1.json`. Consumers read `event.check` (the
persisted row) + `event.input` (the originating DTO). Breaking changes require a
v2 bump + parallel event dispatch.

## 11. Health probes

Ship five Spatie Health probes:

- `PostgisAvailableCheck` — critical. Extension loaded.
- `GeofenceChecksWritableCheck` — critical. Table exists + writable.
- `RecentGeofenceActivityCheck` — non-critical. At least one evaluation in the
  last hour (silence detection).
- `GeofenceOverrideRateCheck` — non-critical. Override rate < 5% of evaluations
  (spike detection).
- `GeofencingHealthChecks` — aggregate registration.

## 12. Deferred until Facilities module lands

- Branch/facility geometry migrations (T1.1, T1.2, T1.4, T1.5)
- Branch fence CRUD endpoints
- Branch fence import/export (CSV / GeoJSON)
- Branch-scoped enforcement toggle
- Full feature-test suite against real branches

Until then, the module ships with the `branch_id` column on `geofence_checks`
unconstrained (no FK) — the column + index exist so the evaluator can be written
and tested today, but the actual FK constraint against `branches(id)` is added
in the migration that ships alongside the Facilities module.

## 13. What this module does NOT do

- **Doesn't own `branches` or `facilities` tables.** Facilities module does.
- **Doesn't read `geofence_enforcement_enabled` toggle.** Consumers do.
- **Doesn't run migrations for other modules' tables.** Only
  `enable_postgis_extension` and `create_geofence_checks_table`.
- **Doesn't run approvals.** Approvals module does — this module publishes
  `GeofenceOverrideRequested` and reads a repository contract, nothing else.

## 14. Depended on by

`staff-clock-in-out`, `athlete-self-check-in`, `visitor-auto-log`, `attendance`
(all future modules).

## 15. Depends on

Foundation, Workspaces, Activity, Audit, Entitlements. Optional: Facilities,
Geography, Notifications.
