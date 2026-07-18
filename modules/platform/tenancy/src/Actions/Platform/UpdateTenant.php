<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Academorix\Tenancy\Data\Requests\UpdateTenantRequestData;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\Tenant;

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
