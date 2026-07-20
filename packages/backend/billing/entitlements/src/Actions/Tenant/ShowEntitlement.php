<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Exceptions\EntitlementNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/entitlements/{key}` — a single entitlement on the
 * caller's tenant by key.
 *
 * `{key}` is the entitlement key (`webhook.subscriptions.max`), not
 * the row id — tenants think in keys, not opaque ULIDs.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.tenant.show')]
#[Get('/api/v1/entitlements/{key}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(EntitlementsPermission::View)]
final class ShowEntitlement
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(string $key): EntitlementData
    {
        $tenant = $this->tenantContext->currentOrFail();

        $entitlement = $this->entitlements->findByKey((string) $tenant->getKey(), $key);
        if ($entitlement === null) {
            throw EntitlementNotFoundException::forKey((string) $tenant->getKey(), $key);
        }

        return EntitlementData::fromModel($entitlement);
    }
}
