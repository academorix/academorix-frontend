<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Data\Requests\CreateBrandingRequestData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/brandings` — platform admin creates a
 * branding profile for a tenant. Platform admins pass tenant_id in
 * the URL query or an admin-scoped session; this action reads it via
 * a context binding.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.platform.create')]
#[Post('/api/v1/platform/brandings')]
#[Middleware(['api', 'auth:platform_admin'])]
#[RequirePermission(BrandingPermission::Manage)]
final class CreateBranding
{
    use AsController;

    public function __construct(
        private readonly BrandingRepositoryInterface $brandings,
    ) {
    }

    public function __invoke(CreateBrandingRequestData $data): BrandingData
    {
        $branding = $this->brandings->create([
            BrandingInterface::ATTR_DOMAIN_ID        => $data->domainId,
            BrandingInterface::ATTR_NAME             => $data->name,
            BrandingInterface::ATTR_IS_DEFAULT       => $data->isDefault,
            BrandingInterface::ATTR_THEME            => $data->theme->value,
            BrandingInterface::ATTR_LOGO_URL         => $data->logoUrl,
            BrandingInterface::ATTR_LOGO_DARK_URL    => $data->logoDarkUrl,
            BrandingInterface::ATTR_FAVICON_URL      => $data->faviconUrl,
            BrandingInterface::ATTR_PRIMARY_COLOR    => $data->primaryColor,
            BrandingInterface::ATTR_SECONDARY_COLOR  => $data->secondaryColor,
            BrandingInterface::ATTR_ACCENT_COLOR     => $data->accentColor,
            BrandingInterface::ATTR_BACKGROUND_COLOR => $data->backgroundColor,
            BrandingInterface::ATTR_SURFACE_COLOR    => $data->surfaceColor,
            BrandingInterface::ATTR_TEXT_COLOR       => $data->textColor,
            BrandingInterface::ATTR_FONT_STACK       => $data->fontStack,
            BrandingInterface::ATTR_CUSTOM_FONT_URL  => $data->customFontUrl,
            BrandingInterface::ATTR_CSS_VARIABLES    => $data->cssVariables,
        ]);

        return BrandingData::fromModel($branding);
    }
}
