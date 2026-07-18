<?php

declare(strict_types=1);

namespace Academorix\Transfer\Actions\Tenant;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Delete;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\WhereUlid;
use Academorix\Routing\Concerns\AsController;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferMappingProfile;
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
