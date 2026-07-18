<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Data\TenantIntegrationData;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/integrations` — every integration owned by the
 * caller tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.tenant.list')]
#[Get('/api/v1/tenant/integrations')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(IntegrationsPermission::ManageOwn)]
final class ListMyIntegrations
{
    use AsController;

    public function __construct(
        private readonly TenantIntegrationRepositoryInterface $integrations,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, TenantIntegrationData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->integrations
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (TenantIntegration $i): TenantIntegrationData => TenantIntegrationData::fromModel($i));

        return new DataCollection(TenantIntegrationData::class, $rows);
    }
}
