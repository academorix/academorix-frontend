<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Data\Requests\UpdateBrandingRequestData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Exceptions\BrandingNotFoundException;
use Academorix\Branding\Models\Branding;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

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
