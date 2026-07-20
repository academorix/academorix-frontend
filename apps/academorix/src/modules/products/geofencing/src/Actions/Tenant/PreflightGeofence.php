<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geofencing\Contracts\Geofenceable;
use Academorix\Geofencing\Contracts\Services\GeofenceServiceInterface;
use Academorix\Geofencing\Data\EvaluateGeofenceData;
use Academorix\Geofencing\Data\GeofenceCheckResultData;
use Academorix\Geofencing\Enums\GeofenceMode;
use Academorix\Geofencing\Enums\GeofenceResult;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Academorix\Geofencing\Exceptions\FenceableNotInTenantException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;

/**
 * `POST /api/v1/geofence/preflight` — mobile pre-flight probe.
 *
 * Runs the evaluator's decision tree WITHOUT persistence. Returns the
 * result DTO with `checkId = null`. Rate-limited at the middleware layer to
 * 60 req/min.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geofence.preflight')]
#[Post('/api/v1/geofence/preflight')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve', 'throttle:geofence-preflight'])]
#[RequirePermission(GeofencingPermission::Preflight)]
final class PreflightGeofence
{
    use AsController;

    public function __construct(
        private readonly GeofenceServiceInterface $service,
    ) {
    }

    public function __invoke(EvaluateGeofenceData $data): GeofenceCheckResultData
    {
        $fenceable = $this->resolveFenceable($data->fenceableType, $data->fenceableId);
        if ($fenceable === null) {
            // Collapse "not found" / "wrong tenant" / "unknown alias" into one
            // response to prevent enumeration — per the blueprint's
            // GEOFENCE_FENCEABLE_NOT_IN_TENANT contract.
            return new GeofenceCheckResultData(
                result: GeofenceResult::Error,
                mode: GeofenceMode::Radius,
                checkId: null,
                distanceToFenceM: null,
                accuracyM: $data->accuracyM,
                fenceableType: $data->fenceableType,
                fenceableId: $data->fenceableId,
            );
        }

        return $this->service->healthCheck($fenceable, $data);
    }

    /**
     * Resolve the fenceable via Laravel's morph map — the CompileMorphAliases
     * listener at boot registers every `#[Geofenceable]` alias with
     * `Relation::enforceMorphMap()`.
     */
    private function resolveFenceable(string $alias, string $id): ?Geofenceable
    {
        $morphMap = Relation::morphMap();
        $className = $morphMap[$alias] ?? null;
        if ($className === null || ! \class_exists($className)) {
            return null;
        }

        /** @var Model $model */
        $model = new $className();
        $row = $model->newQuery()->find($id);
        if ($row === null || ! $row instanceof Geofenceable) {
            return null;
        }

        return $row;
    }
}
