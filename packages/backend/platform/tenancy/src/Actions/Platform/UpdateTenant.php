<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Stackra\Tenancy\Data\Requests\UpdateTenantRequestData;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\Tenant;

/**
 * `PATCH /api/v1/platform/tenants/{tenant}` — update a tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.update')]
#[Patch('/api/v1/platform/tenants/{tenant}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::Manage)]
final class UpdateTenant
{
    use AsController;

    public function __construct(
        private readonly TenantRepositoryInterface $tenants,
    ) {
    }

    public function __invoke(Tenant $tenant, UpdateTenantRequestData $data): TenantData
    {
        // Filter to only-supplied fields; DTO defaults every optional field to null.
        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        $tenant->update($payload);

        return TenantData::fromModel($tenant->refresh());
    }
}
