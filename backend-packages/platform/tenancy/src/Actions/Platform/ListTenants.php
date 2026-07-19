<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\Tenant;
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
