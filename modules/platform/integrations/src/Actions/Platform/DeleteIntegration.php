<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
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
