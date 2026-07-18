<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Data\TenantInterface;
use Academorix\Tenancy\Data\Requests\SuspendTenantRequestData;
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Enums\TenantStatus;
use Academorix\Tenancy\Models\Tenant;
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
