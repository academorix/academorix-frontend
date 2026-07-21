<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Models\TenantIntegration;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/tenant-integrations/{integration}` —
 * soft-delete an integration. The observer schedules the hard-delete
 * purge on the retention window.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.platform.delete')]
#[Delete('/api/v1/platform/tenant-integrations/{integration}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('integration')]
#[RequirePermission(IntegrationsPermission::Manage)]
final class DeleteIntegration
{
    use AsController;

    public function __invoke(TenantIntegration $integration): Response
    {
        $integration->delete();

        return \response()->noContent();
    }
}
