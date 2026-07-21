<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Tenant;

use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Stackra\Tenancy\Data\TenantData;

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
