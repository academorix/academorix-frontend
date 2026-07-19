<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Policies;

use Academorix\Geofencing\Contracts\Data\GeofenceCheckInterface;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Academorix\Geofencing\Models\GeofenceCheck;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see GeofenceCheck}.
 *
 * Tenant users see their own subject rows; admin roles see the whole tenant;
 * platform staff have cross-tenant read via the platform.* permissions.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
final class GeofenceCheckPolicy
{
    public function preflight(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::Preflight->value);
    }

    public function requestOverride(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::OverridesRequest->value);
    }

    public function viewAny(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::ChecksViewAny->value)
            || $user->can(GeofencingPermission::PlatformChecksViewAny->value);
    }

    public function view(Authenticatable $user, GeofenceCheck $check): bool
    {
        if ($user->can(GeofencingPermission::PlatformChecksView->value)) {
            return true;
        }

        return $user->can(GeofencingPermission::ChecksView->value)
            && $this->belongsToCaller($user, $check);
    }

    public function platformViewAny(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::PlatformChecksViewAny->value);
    }

    public function platformView(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::PlatformChecksView->value);
    }

    public function platformOverridesViewAny(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::PlatformOverridesViewAny->value);
    }

    public function platformPurge(Authenticatable $user): bool
    {
        return $user->can(GeofencingPermission::PlatformChecksPurge->value);
    }

    /**
     * A row belongs to the caller when its `subject_id` matches the caller's
     * user id. Tenant admins escape via `ChecksViewAny` above.
     */
    private function belongsToCaller(Authenticatable $user, GeofenceCheck $check): bool
    {
        $callerId = \method_exists($user, 'getKey') ? (string) $user->getKey() : null;
        if ($callerId === null) {
            return false;
        }

        return $callerId === (string) $check->{GeofenceCheckInterface::ATTR_SUBJECT_ID};
    }
}
