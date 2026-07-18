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
