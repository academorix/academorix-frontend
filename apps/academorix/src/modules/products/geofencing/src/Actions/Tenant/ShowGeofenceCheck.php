<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Stackra\Geofencing\Data\GeofenceCheckData;
use Stackra\Geofencing\Enums\GeofencingPermission;
use Stackra\Geofencing\Exceptions\FenceableNotInTenantException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

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
