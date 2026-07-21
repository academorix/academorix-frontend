<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Data\Requests\UpdateOwnTenantRequestData;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;

/**
 * `PATCH /api/current-tenant` — tenant admin edits their own tenant.
 *
 * The `TenantSelfPolicy@updateOwn` ability additionally verifies the
 * caller's `tenant_id` matches the resolved tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.tenant.update')]
#[Patch('/api/current-tenant')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(TenancyPermission::ManageOwnSettings)]
final class UpdateCurrentTenant
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(UpdateOwnTenantRequestData $data): TenantData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        $tenant->update($payload);

        return TenantData::fromModel($tenant->refresh());
    }
}
