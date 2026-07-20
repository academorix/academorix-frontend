<?php

declare(strict_types=1);

namespace Academorix\Branding\Jobs;

use Academorix\Branding\Casts\BrandingPayload;
use Academorix\Branding\Contracts\Data\BrandingInterface;
use Academorix\Branding\Contracts\Repositories\BrandingRepositoryInterface;
use Academorix\Branding\Enums\BrandingTheme;
use Academorix\Tenancy\Contracts\Data\TenantInterface;
use Academorix\Tenancy\Contracts\Repositories\TenantRepositoryInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Denormalise the tenant's default branding into `tenants.branding`
 * (JSONB) so the tenant picker + shell reads the palette without a
 * join.
 *
 * Dispatched by {@see \Academorix\Branding\Observers\BrandingObserver}
 * on every save that touches the default row.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[Queue('default')]
#[Timeout(30)]
#[Tries(3)]
final class SyncBrandingJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $tenantId)
    {
    }

    public function handle(
        TenantRepositoryInterface $tenants,
        BrandingRepositoryInterface $brandings,
    ): void {
        $branding = $brandings->findDefaultForTenant($this->tenantId);
        if ($branding === null) {
            return;
        }

        $themeValue = $branding->{BrandingInterface::ATTR_THEME};
        $theme = $themeValue instanceof BrandingTheme
            ? $themeValue->value
            : (string) ($themeValue ?? BrandingTheme::Auto->value);

        $payload = new BrandingPayload(
            theme: $theme,
            logoUrl: $branding->{BrandingInterface::ATTR_LOGO_URL},
            logoDarkUrl: $branding->{BrandingInterface::ATTR_LOGO_DARK_URL},
            faviconUrl: $branding->{BrandingInterface::ATTR_FAVICON_URL},
            primaryColor: $branding->{BrandingInterface::ATTR_PRIMARY_COLOR},
            secondaryColor: $branding->{BrandingInterface::ATTR_SECONDARY_COLOR},
            accentColor: $branding->{BrandingInterface::ATTR_ACCENT_COLOR},
            backgroundColor: $branding->{BrandingInterface::ATTR_BACKGROUND_COLOR},
            surfaceColor: $branding->{BrandingInterface::ATTR_SURFACE_COLOR},
            textColor: $branding->{BrandingInterface::ATTR_TEXT_COLOR},
            fontStack: $branding->{BrandingInterface::ATTR_FONT_STACK},
            customFontUrl: $branding->{BrandingInterface::ATTR_CUSTOM_FONT_URL},
            cssVariables: $branding->{BrandingInterface::ATTR_CSS_VARIABLES},
        );

        $tenant = $tenants->find($this->tenantId);
        if ($tenant === null) {
            return;
        }

        $tenant->update([
            TenantInterface::ATTR_PRIMARY_BRANDING_ID => (string) $branding->getKey(),
            TenantInterface::ATTR_BRANDING            => $payload->toArray(),
        ]);
    }

    public function failed(\Throwable $e): void
    {
    }
}
