<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Exceptions\BrandingNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

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
