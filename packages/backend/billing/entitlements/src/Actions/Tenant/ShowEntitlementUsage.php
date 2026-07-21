<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Contracts\Repositories\EntitlementUsageRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementUsageData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Exceptions\EntitlementNotFoundException;
use Stackra\Entitlements\Models\EntitlementUsage;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/entitlements/{key}/usage` — audit trail of
 * consumption events for one entitlement on the caller's tenant.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.tenant.usage.show')]
#[Get('/api/v1/entitlements/{key}/usage')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(EntitlementsPermission::View)]
final class ShowEntitlementUsage
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
        private readonly EntitlementUsageRepositoryInterface $usages,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, EntitlementUsageData>
     */
    public function __invoke(string $key): DataCollection
    {
        $tenant      = $this->tenantContext->currentOrFail();
        $entitlement = $this->entitlements->findByKey((string) $tenant->getKey(), $key);
        if ($entitlement === null) {
            throw EntitlementNotFoundException::forKey((string) $tenant->getKey(), $key);
        }

        $rows = $this->usages
            ->findByEntitlement((string) $entitlement->getKey())
            ->map(static fn (EntitlementUsage $u): EntitlementUsageData => EntitlementUsageData::fromModel($u));

        return new DataCollection(EntitlementUsageData::class, $rows);
    }
}
