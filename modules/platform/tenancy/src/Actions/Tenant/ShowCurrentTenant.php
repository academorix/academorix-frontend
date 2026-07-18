<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Tenant;

use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Academorix\Tenancy\Data\TenantData;

/**
 * `GET /api/current-tenant` — the caller's currently-resolved tenant.
 *
 * Runs under the resolved tenant host + `auth:sanctum` — the caller
 * is a tenant user viewing their own tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.tenant.current')]
#[Get('/api/current-tenant')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
final class ShowCurrentTenant
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(): TenantData
    {
        return TenantData::fromModel($this->tenantContext->currentOrFail());
    }
}
