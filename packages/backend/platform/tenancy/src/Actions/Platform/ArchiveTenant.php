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
use Carbon\CarbonImmutable;

/**
 * `POST /api/v1/platform/tenants/{tenant}/archive` — archive a
 * tenant (soft-delete + `status = archived`).
 *
 * The Observer emits `TenantArchived` after the save commits. The
 * retention job (`tenancy:hard-delete-archived`) picks it up 30 days
 * later for hard-delete (which fires `TenantErased`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.archive')]
#[Post('/api/v1/platform/tenants/{tenant}/archive')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::Manage)]
final class ArchiveTenant
{
    use AsController;

    public function __invoke(Tenant $tenant): TenantData
    {
        $tenant->update([
            TenantInterface::ATTR_STATUS       => TenantStatus::Archived,
            TenantInterface::ATTR_ARCHIVED_AT  => CarbonImmutable::now(),
        ]);
        $tenant->delete();

        return TenantData::fromModel($tenant->refresh());
    }
}
