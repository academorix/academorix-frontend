<?php

declare(strict_types=1);

namespace Stackra\Transfer\Actions\Tenant;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Delete;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\WhereUlid;
use Stackra\Routing\Concerns\AsController;
use Stackra\Transfer\Enums\TransferPermission;
use Stackra\Transfer\Models\XferMappingProfile;
use Illuminate\Http\Response;

/**
 * `DELETE /api/v1/transfer/mapping-profiles/{profile}` — soft
 * delete a profile.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsAction(name: 'transfer.mapping_profiles.delete')]
#[Delete('/api/v1/transfer/mapping-profiles/{profile}')]
#[Middleware(['api', 'resolve.tenant', 'auth:sanctum', 'tenant.user', 'throttle:transfer-read'])]
#[WhereUlid('profile')]
#[RequirePermission(TransferPermission::MappingProfilesDelete)]
final class DeleteMappingProfile
{
    use AsController;

    public function __invoke(XferMappingProfile $profile): Response
    {
        $profile->delete();

        return \response()->noContent();
    }
}
