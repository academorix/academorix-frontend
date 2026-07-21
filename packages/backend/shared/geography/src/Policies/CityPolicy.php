<?php

declare(strict_types=1);

namespace Stackra\Geography\Policies;

use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\City;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see City}. Public reads + platform-admin
 * writes; see {@see CountryPolicy} for the pattern.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CityPolicy
{
    public function viewAny(?Authenticatable $user = null): bool
    {
        return true;
    }

    public function view(?Authenticatable $user, City $city): bool
    {
        return true;
    }

    public function platformCreate(Authenticatable $user): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    public function platformUpdate(Authenticatable $user, City $city): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    public function platformDelete(Authenticatable $user, City $city): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }
}
