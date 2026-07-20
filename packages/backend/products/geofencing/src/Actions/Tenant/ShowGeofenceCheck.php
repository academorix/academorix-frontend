<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Academorix\Geofencing\Data\GeofenceCheckData;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Academorix\Geofencing\Exceptions\FenceableNotInTenantException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geofence/checks/{check}` — show a single geofence check.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geofence.checks.show')]
#[Get('/api/v1/geofence/checks/{check}')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(GeofencingPermission::ChecksView)]
final class ShowGeofenceCheck
{
    use AsController;

    public function __construct(
        private readonly GeofenceCheckRepositoryInterface $repository,
    ) {
    }

    public function __invoke(string $check): GeofenceCheckData
    {
        $row = $this->repository->find($check);
        if ($row === null) {
            throw new FenceableNotInTenantException(\sprintf('Check %s not found.', $check));
        }

        return GeofenceCheckData::fromModel($row);
    }
}
