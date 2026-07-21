<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Contracts\Repositories\XferMappingProfileRepositoryInterface;
use Stackra\Transfer\Data\XferMappingProfileData;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferMappingProfile;
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
