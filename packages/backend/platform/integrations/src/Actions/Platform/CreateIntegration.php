<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Contracts\Repositories\TenantIntegrationRepositoryInterface;
use Stackra\Integrations\Data\Requests\CreateIntegrationRequestData;
use Stackra\Integrations\Data\TenantIntegrationData;
use Stackra\Integrations\Enums\IntegrationSyncStatus;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/tenant-integrations` — platform admin
 * creates an integration on behalf of a tenant.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.platform.create')]
#[Post('/api/v1/platform/tenant-integrations')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(IntegrationsPermission::Manage)]
final class CreateIntegration
{
    use AsController;

    public function __construct(
        private readonly TenantIntegrationRepositoryInterface $integrations,
    ) {
    }

    public function __invoke(CreateIntegrationRequestData $data): TenantIntegrationData
    {
        $integration = $this->integrations->create([
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
