<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Models\Branding;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

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
