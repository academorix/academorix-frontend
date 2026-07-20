<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Data\XferMappingProfileData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferMappingProfile;

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
