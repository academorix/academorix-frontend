<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Stackra\Integrations\Data\TenantIntegrationData;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Models\TenantIntegration;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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
