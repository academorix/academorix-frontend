<?php

declare(strict_types=1);

namespace Academorix\Geography\Policies;

use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Timezone;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Timezone}. Public reads +
 * platform-admin writes; see {@see CountryPolicy} for the pattern.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class TimezonePolicy
{
    public function viewAny(?Authenticatable $user = null): bool
    {
        return true;
    }

    public function view(?Authenticatable $user, Timezone $timezone): bool
    {
        return true;
    }

    public function platformCreate(Authenticatable $user): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    public function platformUpdate(Authenticatable $user, Timezone $timezone): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    public function platformDelete(Authenticatable $user, Timezone $timezone): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }
}
