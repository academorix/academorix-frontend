<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Exceptions\BrandingNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `GET /api/v1/tenant/branding` — the caller tenant's default branding.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.tenant.show')]
#[Get('/api/v1/tenant/branding')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(BrandingPermission::ManageOwn)]
final class ShowMyBranding
{
    use AsController;

    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(): BrandingData
    {
        $tenant   = $this->tenantContext->currentOrFail();
        $branding = $this->brandings->findDefaultForTenant((string) $tenant->getKey());

        if ($branding === null) {
            throw new BrandingNotFoundException(\sprintf(
                'No default branding for tenant "%s".',
                $tenant->getKey(),
            ));
        }

        return BrandingData::fromModel($branding);
    }
}
