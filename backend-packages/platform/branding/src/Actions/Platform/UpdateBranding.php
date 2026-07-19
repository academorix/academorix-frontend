<?php

declare(strict_types=1);

namespace Academorix\Branding\Actions\Platform;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Branding\Data\BrandingData;
use Academorix\Branding\Data\Requests\UpdateBrandingRequestData;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\Branding\Models\Branding;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/brandings/{branding}` — update a branding
 * profile.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.platform.update')]
#[Patch('/api/v1/platform/brandings/{branding}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('branding')]
#[RequirePermission(BrandingPermission::Manage)]
final class UpdateBranding
{
    use AsController;

    public function __invoke(Branding $branding, UpdateBrandingRequestData $data): BrandingData
    {
        $payload = \array_filter(
            $data->toArray(),
            static fn (mixed $v): bool => $v !== null,
        );

        $branding->update($payload);

        return BrandingData::fromModel($branding->refresh());
    }
}
