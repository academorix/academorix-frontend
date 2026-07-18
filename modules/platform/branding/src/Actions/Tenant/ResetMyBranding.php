<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Enums\BrandingTheme;
use Academorix\Branding\Events\BrandingReset;
use Academorix\Branding\Exceptions\BrandingNotFoundException;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;

/**
 * `POST /api/v1/tenant/branding/reset` — reset the caller tenant's
 * default branding to platform defaults.
 *
 * Nulls every override; leaves the row + its `is_default = true` flag
 * intact.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.tenant.reset')]
#[Post('/api/v1/tenant/branding/reset')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user'])]
#[RequirePermission(BrandingPermission::ManageOwn)]
final class ResetMyBranding
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

        $branding->update([
            BrandingInterface::ATTR_THEME            => BrandingTheme::Auto->value,
            BrandingInterface::ATTR_LOGO_URL         => null,
            BrandingInterface::ATTR_LOGO_DARK_URL    => null,
            BrandingInterface::ATTR_FAVICON_URL      => null,
            BrandingInterface::ATTR_PRIMARY_COLOR    => null,
            BrandingInterface::ATTR_SECONDARY_COLOR  => null,
            BrandingInterface::ATTR_ACCENT_COLOR     => null,
            BrandingInterface::ATTR_BACKGROUND_COLOR => null,
            BrandingInterface::ATTR_SURFACE_COLOR    => null,
            BrandingInterface::ATTR_TEXT_COLOR       => null,
            BrandingInterface::ATTR_FONT_STACK       => null,
            BrandingInterface::ATTR_CUSTOM_FONT_URL  => null,
            BrandingInterface::ATTR_CSS_VARIABLES    => null,
        ]);

        BrandingReset::dispatch($branding->refresh());

        return BrandingData::fromModel($branding->refresh());
    }
}
