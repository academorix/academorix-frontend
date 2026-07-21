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
use Stackra\Tenancy\Data\TenantData;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Models\Tenant;

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
