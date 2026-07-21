<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/platform/brandings/{branding}` — read one branding profile.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.platform.show')]
#[Get('/api/v1/platform/brandings/{branding}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('branding')]
#[RequirePermission(BrandingPermission::View)]
final class ShowBranding
{
    use AsController;

    public function __invoke(Branding $branding): BrandingData
    {
        return BrandingData::fromModel($branding);
    }
}
