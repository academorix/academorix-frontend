<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Enums\BrandingTheme;
use Stackra\Branding\Events\BrandingReset;
use Stackra\Branding\Exceptions\BrandingNotFoundException;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;

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
