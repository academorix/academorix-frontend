<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Data\XferMappingProfileInterface;
use Stackra\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface;
use Stackra\Transfer\Data\Requests\CreateMappingProfileRequestData;
use Stackra\Transfer\Data\XferMappingProfileData;
use Stackra\Transfer\Enums\TransferPermission;

/**
 * `POST /api/v1/transfer/mapping-profiles` — create a saved profile.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.mapping_profiles.create')]
#[Post('/api/v1/transfer/mapping-profiles')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::MappingProfilesCreate)]
final class CreateMappingProfile
{
    use AsController;

    public function __construct(
        private readonly XferMappingProfileRepositoryInterface $profiles,
    ) {
    }

    public function __invoke(CreateMappingProfileRequestData $data): XferMappingProfileData
    {
        /** @var \Stackra\Transfer\Models\XferMappingProfile $profile */
        $profile = $this->profiles->create([
            XferMappingProfileInterface::ATTR_ENTITY_KEY => $data->entity,
            XferMappingProfileInterface::ATTR_NAME       => $data->name,
            XferMappingProfileInterface::ATTR_HEADER_MAP => $data->headerMap,
            XferMappingProfileInterface::ATTR_DESCRIPTION => $data->description,
            XferMappingProfileInterface::ATTR_IS_SHARED  => $data->isShared,
        ]);

        return XferMappingProfileData::fromModel($profile);
    }
}
