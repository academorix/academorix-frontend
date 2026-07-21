<?php

declare(strict_types=1);

namespace Stackra\Branding\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Branding\Contracts\Data\BrandingInterface;
use Stackra\Branding\Enums\BrandingPermission;
use Stackra\Branding\Exceptions\LastDefaultBrandingException;
use Stackra\Branding\Models\Branding;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/platform/brandings/{branding}` — soft-delete a
 * branding profile. Refuses when the target is the tenant's last
 * default (would orphan the tenant).
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsAction(name: 'branding.platform.delete')]
#[Delete('/api/v1/platform/brandings/{branding}')]
#[Middleware(['api', 'auth:platform_admin'])]
#[WhereUlid('branding')]
#[RequirePermission(BrandingPermission::Manage)]
final class DeleteBranding
{
    use AsController;

    public function __invoke(Branding $branding): Response
    {
        if ($branding->isDefault()) {
            $others = Branding::query()
                ->where(BrandingInterface::ATTR_TENANT_ID, $branding->{BrandingInterface::ATTR_TENANT_ID})
                ->where(BrandingInterface::ATTR_ID, '!=', $branding->getKey())
                ->exists();

            if (! $others) {
                throw new LastDefaultBrandingException(\sprintf(
                    'Cannot delete the last default branding for tenant "%s".',
                    $branding->{BrandingInterface::ATTR_TENANT_ID},
                ));
            }
        }

        $branding->delete();

        return \response()->noContent();
    }
}
