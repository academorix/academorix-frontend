<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Stackra\Integrations\Data\TenantIntegrationData;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Models\TenantIntegration;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
