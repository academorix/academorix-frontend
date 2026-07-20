<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Data\Requests\UpdateMappingProfileRequestData;
use Academorix\Transfer\Data\XferMappingProfileData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferMappingProfile;

/**
 * `PATCH /api/v1/transfer/mapping-profiles/{profile}` — update.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.mapping_profiles.update')]
#[Patch('/api/v1/transfer/mapping-profiles/{profile}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('profile')]
#[RequirePermission(TransferPermission::MappingProfilesUpdate)]
final class UpdateMappingProfile
{
    use AsController;

    public function __invoke(XferMappingProfile $profile, UpdateMappingProfileRequestData $data): XferMappingProfileData
    {
        $updates = \array_filter([
            XferMappingProfileInterface::ATTR_NAME        => $data->name,
            XferMappingProfileInterface::ATTR_HEADER_MAP  => $data->headerMap,
            XferMappingProfileInterface::ATTR_DESCRIPTION => $data->description,
            XferMappingProfileInterface::ATTR_IS_SHARED   => $data->isShared,
        ], static fn (mixed $value): bool => $value !== null);

        $profile->fill($updates)->save();

        return XferMappingProfileData::fromModel($profile);
    }
}
