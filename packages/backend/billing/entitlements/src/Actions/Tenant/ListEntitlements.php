<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Stackra\Entitlements\Data\EntitlementData;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\Entitlements\Models\Entitlement;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/entitlements` — every entitlement owned by the
 * caller's tenant.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsAction(name: 'entitlements.tenant.list')]
#[Get('/api/v1/entitlements')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(EntitlementsPermission::View)]
final class ListEntitlements
{
    use AsController;

    public function __construct(
        private readonly EntitlementRepositoryInterface $entitlements,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, EntitlementData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->entitlements
            ->findAllForTenant((string) $tenant->getKey())
            ->map(static fn (Entitlement $e): EntitlementData => EntitlementData::fromModel($e));

        return new DataCollection(EntitlementData::class, $rows);
    }
}
