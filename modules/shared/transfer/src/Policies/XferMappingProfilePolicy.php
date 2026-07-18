<?php

declare(strict_types=1);

namespace Academorix\Transfer\Policies;

use Academorix\Transfer\Contracts\Data\XferMappingProfileInterface;
use Academorix\Transfer\Enums\TransferPermission;
use Academorix\Transfer\Models\XferMappingProfile;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see XferMappingProfile}.
 *
 * Caller sees own profiles + any `is_shared = true` in the tenant.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
final class XferMappingProfilePolicy
{
    /**
     * `viewAny` — list mapping profiles.
     */
    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(TransferPermission::MappingProfilesViewAny->value);
    }

    /**
     * `view` — show one mapping profile.
     */
    public function view(Authenticatable $user, XferMappingProfile $profile): bool
    {
        if (! $user->can(TransferPermission::MappingProfilesView->value)) {
            return false;
        }

        return $this->isOwner($user, $profile) || $this->isShared($profile);
    }

    /**
     * `create` — create a new profile.
     */
    public function create(Authenticatable $user): bool
    {
        return $user->can(TransferPermission::MappingProfilesCreate->value);
    }

    /**
     * `update` — update a profile.
     */
    public function update(Authenticatable $user, XferMappingProfile $profile): bool
    {
        return $user->can(TransferPermission::MappingProfilesUpdate->value)
            && $this->isOwner($user, $profile);
    }

    /**
     * `share` — flip is_shared on the profile.
     */
    public function share(Authenticatable $user, XferMappingProfile $profile): bool
    {
        return $user->can(TransferPermission::MappingProfilesShare->value)
            && $this->isOwner($user, $profile);
    }

    /**
     * `delete` — delete the profile.
     */
    public function delete(Authenticatable $user, XferMappingProfile $profile): bool
    {
        return $user->can(TransferPermission::MappingProfilesDelete->value)
            && $this->isOwner($user, $profile);
    }

    /**
     * Whether the caller owns the profile.
     */
    private function isOwner(Authenticatable $user, XferMappingProfile $profile): bool
    {
        $ownerId = $profile->{XferMappingProfileInterface::ATTR_OWNER_ID};

        return $ownerId !== null
            && (string) $user->getAuthIdentifier() === (string) $ownerId;
    }

    /**
     * Whether the profile is marked shared in the tenant.
     */
    private function isShared(XferMappingProfile $profile): bool
    {
        return (bool) $profile->{XferMappingProfileInterface::ATTR_IS_SHARED};
    }
}
