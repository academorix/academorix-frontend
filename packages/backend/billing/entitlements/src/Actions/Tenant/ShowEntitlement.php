<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Exceptions\EntitlementNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

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
