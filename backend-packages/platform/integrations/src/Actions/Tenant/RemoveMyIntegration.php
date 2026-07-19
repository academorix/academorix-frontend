<?php

declare(strict_types=1);

namespace Academorix\Integrations\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Integrations\Contracts\Data\TenantIntegrationInterface;
use Academorix\Integrations\Enums\IntegrationsPermission;
use Academorix\Integrations\Exceptions\IntegrationNotFoundException;
use Academorix\Integrations\Models\TenantIntegration;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/tenant/integrations/{id}` — tenant admin
 * soft-deletes one of their own integrations. The observer schedules
 * the hard-delete purge on the retention window.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsAction(name: 'integrations.tenant.remove')]
#[Delete('/api/v1/tenant/integrations/{integration}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[WhereUlid('integration')]
#[RequirePermission(IntegrationsPermission::ManageOwn)]
final class RemoveMyIntegration
{
    use AsController;

    public function __construct(
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(TenantIntegration $integration): Response
    {
        $tenant = $this->tenantContext->currentOrFail();

        if ((string) $integration->{TenantIntegrationInterface::ATTR_TENANT_ID} !== (string) $tenant->getKey()) {
            throw new IntegrationNotFoundException(\sprintf(
                'Integration "%s" does not belong to the current tenant.',
                $integration->getKey(),
            ));
        }

        $integration->delete();

        return \response()->noContent();
    }
}
