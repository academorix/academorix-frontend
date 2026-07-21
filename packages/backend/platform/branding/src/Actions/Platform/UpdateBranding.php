<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Data\BrandingData;
use Stackra\Branding\Data\Requests\UpdateBrandingRequestData;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;

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
