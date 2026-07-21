<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Data\XferMappingProfileInterface;
use Stackra\Transfer\Data\Requests\UpdateMappingProfileRequestData;
use Stackra\Transfer\Data\XferMappingProfileData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferMappingProfile;

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
