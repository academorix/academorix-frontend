<?php

declare(strict_types=1);

namespace Academorix\Geography\Policies;

use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Country;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Authorization policy for {@see Country}.
 *
 * Read actions (`viewAny`, `view`) accept a nullable Authenticatable
 * so anonymous requests pass — reference-catalog data is public.
 * Write actions (`platformCreate`, `platformUpdate`, `platformDelete`)
 * require the platform-admin `platform.geography.manage` permission.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CountryPolicy
{
    /**
     * `viewAny` — list countries. Public: nullable actor passes.
     */
    public function viewAny(?Authenticatable $user = null): bool
    {
        return true;
    }

    /**
     * `view` — show one country. Public: nullable actor passes.
     */
    public function view(?Authenticatable $user, Country $country): bool
    {
        return true;
    }

    /**
     * `platformCreate` — platform-admin write path.
     */
    public function platformCreate(Authenticatable $user): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    /**
     * `platformUpdate` — platform-admin write path.
     */
    public function platformUpdate(Authenticatable $user, Country $country): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }

    /**
     * `platformDelete` — platform-admin write path. Deletes usually
     * archive (status=0) rather than hard-delete; downstream FK
     * integrity is preserved.
     */
    public function platformDelete(Authenticatable $user, Country $country): bool
    {
        return $user->can(GeographyPermission::PlatformManage->value);
    }
}
