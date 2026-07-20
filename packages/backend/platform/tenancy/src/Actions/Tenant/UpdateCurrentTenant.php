<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Tenancy\Data\Requests\UpdateOwnTenantRequestData;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;

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
