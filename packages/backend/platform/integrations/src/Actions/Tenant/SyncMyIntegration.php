<?php

declare(strict_types=1);

namespace Stackra\Integrations\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Integrations\Contracts\Data\TenantIntegrationInterface;
use Stackra\Integrations\Data\TenantIntegrationData;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\Integrations\Exceptions\IntegrationDisabledException;
use Stackra\Integrations\Exceptions\IntegrationNotFoundException;
use Stackra\Integrations\Jobs\SyncIntegrationJob;
use Stackra\Integrations\Models\TenantIntegration;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/integrations/{id}/sync` — tenant admin
 * triggers an on-demand sync run for one of their integrations.
 *
 * Dispatches {@see SyncIntegrationJob} onto the `integrations` queue;
 * returns the current row snapshot so the FE can render the "sync
 * queued" state.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.tenant.sync')]
#[Post('/api/v1/tenant/integrations/{integration}/sync')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('integration')]
#[RequirePermission(IntegrationsPermission::ManageOwn)]
final class SyncMyIntegration
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(TenantIntegration $integration): TenantIntegrationData
    {
        $tenant = $this->tenantContext->currentOrFail();

        if ((string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()) {
            throw new IntegrationNotFoundException(\sprintf(
                'Integration "%s" does not belong to the current tenant.',
                $integration->getKey(),
            ));
        }

        if ((bool) $integration->{TenantIntegrationInterface::ATTR_IS_ACTIVE} !== true) {
            throw new IntegrationDisabledException(\sprintf(
                'Integration "%s" is disabled and cannot be synced.',
                $integration->getKey(),
            ));
        }

        SyncIntegrationJob::dispatch((string) $integration->getKey());

        return TenantIntegrationData::fromModel($integration);
    }
}
