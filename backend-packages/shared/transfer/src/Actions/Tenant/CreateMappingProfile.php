<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface;
use Academorix\Transfer\Data\Requests\CreateMappingProfileRequestData;
use Academorix\Transfer\Data\XferMappingProfileData;
use Academorix\Transfer\Enums\TransferPermission;

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
        /** @var \Academorix\Transfer\Models\XferMappingProfile $profile */
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
