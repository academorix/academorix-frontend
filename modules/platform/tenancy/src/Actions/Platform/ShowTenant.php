<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\Tenant;

/**
 * `GET /api/v1/platform/tenants/{tenant}` — read one tenant.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.show')]
#[Get('/api/v1/platform/tenants/{tenant}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::View)]
final class ShowTenant
{
    use AsController;

    public function __invoke(Tenant $tenant): TenantData
    {
        return TenantData::fromModel($tenant);
    }
}
