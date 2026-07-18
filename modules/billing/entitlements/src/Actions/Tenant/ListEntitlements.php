<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Entitlements\Contracts\Repositories\EntitlementRepositoryInterface;
use Academorix\Entitlements\Data\EntitlementData;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\Entitlements\Models\Entitlement;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
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
