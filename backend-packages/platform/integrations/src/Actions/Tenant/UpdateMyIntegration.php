<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Data\Requests\UpdateIntegrationRequestData;
use Academorix\Integrations\Data\TenantIntegrationData;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Exceptions\IntegrationNotFoundException;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `PATCH /api/v1/tenant/integrations/{id}` — tenant admin updates one
 * of their own integrations.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.tenant.update')]
#[Patch('/api/v1/tenant/integrations/{integration}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('integration')]
#[RequirePermission(IntegrationsPermission::ManageOwn)]
final class UpdateMyIntegration
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(
        TenantIntegration $integration,
        UpdateIntegrationRequestData $data,
    ): TenantIntegrationData {
        $tenant = $this->tenantContext->currentOrFail();

        if ((string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()) {
            throw new IntegrationNotFoundException(\sprintf(
                'Integration "%s" does not belong to the current tenant.',
                $integration->getKey(),
            ));
        }

        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        // Never let a tenant admin re-parent an integration.
        unset($payload[TenantIntegrationInterface::ATTR_TENANT_ID]);

        $integration->update($payload);

        return TenantIntegrationData::fromModel($integration->refresh());
    }
}
