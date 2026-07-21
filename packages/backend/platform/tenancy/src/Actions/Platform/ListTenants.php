<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\Tenant;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/tenants` — list every tenant across every
 * Application. Platform-admin only.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.list')]
#[Get('/api/v1/platform/tenants')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(TenancyPermission::View)]
final class ListTenants
{
    use AsController;

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    /**
     * @return DataCollection<int, TenantData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->tenants->paginate()
            ->getCollection()
            ->map(static fn (Tenant $t): TenantData => TenantData::fromModel($t));

        return new DataCollection(TenantData::class, $rows);
    }
}
