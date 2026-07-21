<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Stackra\Geofencing\Data\GeofenceCheckData;
use Stackra\Geofencing\Enums\GeofencingPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/geofence/checks` — tenant-scoped audit log read.
 *
 * Regular users see their own subject rows (policy-enforced). Tenant admins
 * see the tenant-wide log.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geofence.checks.list')]
#[Get('/api/v1/geofence/checks')]
#[Middleware(['api', 'auth:sanctum', 'tenant.resolve'])]
#[RequirePermission(GeofencingPermission::ChecksViewAny)]
final class ListGeofenceChecks
{
    use AsController;

    public function __construct(
        private readonly GeofenceCheckRepositoryInterface $repository,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return array<int, GeofenceCheckData>
     */
    public function __invoke(): array
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $tenantId = (string) $tenant->getKey();

        return $this->repository->findByTenant($tenantId)
            ->map(static fn ($check): GeofenceCheckData => GeofenceCheckData::fromModel($check))
            ->all();
    }
}
