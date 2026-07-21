<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Data\TenantIntegrationData;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Models\TenantIntegration;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
