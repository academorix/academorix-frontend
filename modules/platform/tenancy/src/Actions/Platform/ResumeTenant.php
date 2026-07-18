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
use Academorix\Tenancy\Data\TenantData;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Enums\TenantStatus;
use Academorix\Tenancy\Models\Tenant;

/**
 * `POST /api/v1/platform/tenants/{tenant}/resume` — return a
 * suspended tenant to `status = active`.
 *
 * The Observer emits `TenantResumed` after the save commits.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.resume')]
#[Post('/api/v1/platform/tenants/{tenant}/resume')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::Manage)]
final class ResumeTenant
{
    use AsController;

    public function __invoke(Tenant $tenant): TenantData
    {
        $tenant->update([
            TenantInterface::ATTR_STATUS            => TenantStatus::Active,
            TenantInterface::ATTR_SUSPENDED_AT      => null,
            TenantInterface::ATTR_SUSPENSION_REASON => null,
            TenantInterface::ATTR_GRACE_ENDS_AT     => null,
        ]);

        return TenantData::fromModel($tenant->refresh());
    }
}
