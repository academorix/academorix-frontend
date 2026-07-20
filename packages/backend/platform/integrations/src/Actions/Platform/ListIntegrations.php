<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Data\TenantIntegrationData;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/platform/tenant-integrations` — every integration
 * across every tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.platform.list')]
#[Get('/api/v1/platform/tenant-integrations')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(IntegrationsPermission::View)]
final class ListIntegrations
{
    use AsController;

    public function __construct(
        private readonly TenantIntegrationRepositoryInterface $integrations,
    ) {
    }

    /**
     * @return DataCollection<int, TenantIntegrationData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->integrations->paginate()
            ->getCollection()
            ->map(static fn (TenantIntegration $i): TenantIntegrationData => TenantIntegrationData::fromModel($i));

        return new DataCollection(TenantIntegrationData::class, $rows);
    }
}
