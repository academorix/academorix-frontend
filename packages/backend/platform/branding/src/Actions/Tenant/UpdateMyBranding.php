<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Data\Requests\UpdateBrandingRequestData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Exceptions\BrandingNotFoundException;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `PATCH /api/v1/tenant/branding` — tenant admin updates their
 * default branding (implicit — server picks the default row).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.tenant.update')]
#[Patch('/api/v1/tenant/branding')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(BrandingPermission::ManageOwn)]
final class UpdateMyBranding
{
    use AsController;

    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    public function __invoke(UpdateBrandingRequestData $data): BrandingData
    {
        $tenant = $this->tenantContext->currentOrFail();

        /** @var Branding|null $branding */
        $branding = $this->brandings->findDefaultForTenant((string) $tenant->getKey());

        if ($branding === null) {
            throw new BrandingNotFoundException(\sprintf(
                'No default branding for tenant "%s". Provision one first.',
                $tenant->getKey(),
            ));
        }

        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        // Never allow a tenant to change tenant_id.
        unset($payload[BrandingInterface::ATTR_TENANT_ID]);

        $branding->update($payload);

        return BrandingData::fromModel($branding->refresh());
    }
}
