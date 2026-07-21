<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Enums\TenancyPermission;
use Stackra\Tenancy\Models\Tenant;
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
