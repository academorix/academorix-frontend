<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Data\TenantIntegrationData;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/tenant-integrations/{integration}` — read one
 * integration (config always redacted).
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.platform.show')]
#[Get('/api/v1/platform/tenant-integrations/{integration}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('integration')]
#[RequirePermission(IntegrationsPermission::View)]
final class ShowIntegration
{
    use AsController;

    public function __invoke(TenantIntegration $integration): TenantIntegrationData
    {
        return TenantIntegrationData::fromModel($integration);
    }
}
