<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Data\XferMappingProfileData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferMappingProfile;

/**
 * `GET /api/v1/transfer/mapping-profiles/{profile}` — show one.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.mapping_profiles.show')]
#[Get('/api/v1/transfer/mapping-profiles/{profile}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('profile')]
#[RequirePermission(TransferPermission::MappingProfilesView)]
final class ShowMappingProfile
{
    use AsController;

    public function __invoke(XferMappingProfile $profile): XferMappingProfileData
    {
        return XferMappingProfileData::fromModel($profile);
    }
}
