<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geofencing\Contracts\Repositories\GeofenceCheckRepositoryInterface;
use Academorix\Geofencing\Data\GeofenceCheckData;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

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
