<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
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
