<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Data\Requests\SuspendTenantRequestData;
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Models\Tenant;
use Carbon\CarbonImmutable;

/**
 * `POST /api/v1/platform/tenants/{tenant}/suspend` — transition a
 * tenant to `status = suspended`.
 *
 * The Observer emits `TenantSuspended` after the save commits.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.suspend')]
#[Post('/api/v1/platform/tenants/{tenant}/suspend')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::Manage)]
final class SuspendTenant
{
    use AsController;

    public function __invoke(Tenant $tenant, SuspendTenantRequestData $data): TenantData
    {
        $tenant->update([
            TenantInterface::ATTR_STATUS            => TenantStatus::Suspended,
            TenantInterface::ATTR_SUSPENDED_AT      => CarbonImmutable::now(),
            TenantInterface::ATTR_SUSPENSION_REASON => $data->reason,
        ]);

        return TenantData::fromModel($tenant->refresh());
    }
}
