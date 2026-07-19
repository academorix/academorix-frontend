<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Enums\TenancyPermission;
use Academorix\Tenancy\Models\Tenant;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/tenants/{tenant}` — soft-delete (archive)
 * a tenant.
 *
 * The retention job hard-deletes 30 days later (see
 * `HardDeleteArchivedTenantJob` + `TenantErased`).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsAction(name: 'tenants.platform.delete')]
#[Delete('/api/v1/platform/tenants/{tenant}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('tenant')]
#[RequirePermission(TenancyPermission::Manage)]
final class DeleteTenant
{
    use AsController;

    public function __invoke(Tenant $tenant): Response
    {
        $tenant->delete();

        return \response()->noContent();
    }
}
