<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Academorix\Integrations\Data\Requests\CreateIntegrationRequestData;
use Academorix\Integrations\Data\TenantIntegrationData;
use Academorix\Integrations\Enums\IntegrationSyncStatus;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/integrations` — tenant admin configures a
 * new integration for their own tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.tenant.add')]
#[Post('/api/v1/tenant/integrations')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(IntegrationsPermission::ManageOwn)]
final class AddIntegration
{
    use AsController;

    public function __construct(
        private readonly TenantIntegrationRepositoryInterface $integrations,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(CreateIntegrationRequestData $data): TenantIntegrationData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $integration = $this->integrations->create([
            TenantIntegrationInterface::ATTR_TENANT_ID        => (string) $tenant->getKey(),
            TenantIntegrationInterface::ATTR_KIND             => $data->kind->value,
            TenantIntegrationInterface::ATTR_PROVIDER         => $data->provider,
            TenantIntegrationInterface::ATTR_NAME             => $data->name,
            TenantIntegrationInterface::ATTR_CONFIG           => $data->config,
            TenantIntegrationInterface::ATTR_IS_ACTIVE        => $data->isActive,
            TenantIntegrationInterface::ATTR_LAST_SYNC_STATUS => IntegrationSyncStatus::Unknown->value,
        ]);

        return TenantIntegrationData::fromModel($integration);
    }
}
