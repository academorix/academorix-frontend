<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Models\Branding;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/tenant/brandings` — every branding profile owned by
 * the caller tenant (day/night variants, per-domain profiles).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.tenant.list')]
#[Get('/api/v1/tenant/brandings')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(BrandingPermission::ManageOwn)]
final class ListMyBrandings
{
    use AsController;

    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * @return DataCollection<int, BrandingData>
     */
    public function __invoke(): DataCollection
    {
        $tenant = $this->tenantContext->currentOrFail();

        $rows = $this->brandings
            ->findByTenant((string) $tenant->getKey())
            ->map(static fn (Branding $b): BrandingData => BrandingData::fromModel($b));

        return new DataCollection(BrandingData::class, $rows);
    }
}
