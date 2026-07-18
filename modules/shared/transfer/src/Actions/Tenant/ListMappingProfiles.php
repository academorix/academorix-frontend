<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface;
use Academorix\Transfer\Data\XferMappingProfileData;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferMappingProfile;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/transfer/mapping-profiles` — list caller's profiles.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.mapping_profiles.list')]
#[Get('/api/v1/transfer/mapping-profiles')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[RequirePermission(TransferPermission::MappingProfilesViewAny)]
final class ListMappingProfiles
{
    use AsController;

    public function __construct(
        private readonly XferMappingProfileRepositoryInterface $profiles,
    ) {
    }

    /**
     * @return DataCollection<int, XferMappingProfileData>
     */
    public function __invoke(): DataCollection
    {
        $rows = $this->profiles->paginate()
            ->getCollection()
            ->map(static fn (XferMappingProfile $p): XferMappingProfileData => XferMappingProfileData::fromModel($p));

        return new DataCollection(XferMappingProfileData::class, $rows);
    }
}
