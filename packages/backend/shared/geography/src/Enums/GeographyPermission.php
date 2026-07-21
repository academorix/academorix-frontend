<?php

declare(strict_types=1);

namespace Stackra\Geography\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the Geography module contributes.
 *
 * Cases split across two guards. The tenant-user permission
 * ({@see self::Geolocate}) targets the `sanctum` guard for the
 * authenticated + rate-limited `/geolocate` endpoint. The platform
 * admin permissions ({@see self::PlatformManage}, {@see self::PlatformView})
 * target the `platform_admin` guard for the rare catalog-hotfix
 * write surface.
 *
 * Reference-catalog read routes (countries / states / cities /
 * currencies / languages / timezones) are PUBLIC — no permission
 * required. The policies accept a nullable `Authenticatable` so
 * anonymous requests pass. This is intentional: every marketing
 * page + signup flow depends on the catalog.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum GeographyPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `geography.geolocate` — call `/api/v1/geography/geolocate`.
     * Rate-limited to 10 req/min per user via the `throttle:geolocate`
     * limiter registered by the service provider.
     */
    #[Label('Call Geolocate')]
    #[Description('Call the /api/v1/geography/geolocate endpoint. Rate-limited to 10 req/min per user.')]
    case Geolocate = 'geography.geolocate';

    /**
     * `platform.geography.manage` — write access to the reference
     * catalog. Rare — the vendor seeder is the source of truth, and
     * overrides survive `world:install --force` via the observers'
     * `updated_by` guard.
     */
    #[Label('Manage Geography Catalog')]
    #[Description('Write access to the reference catalog. Platform admins only — vendor seeder is the source of truth.')]
    case PlatformManage = 'platform.geography.manage';

    /**
     * `platform.geography.view` — read the catalog administratively.
     */
    #[Label('View Geography Catalog (Platform)')]
    #[Description('Administrative read access to the reference catalog.')]
    case PlatformView = 'platform.geography.view';

    /**
     * The Laravel guard this permission binds to. Tenant-user
     * permission targets `sanctum`; platform-admin catalog
     * permissions target `platform_admin`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::Geolocate                        => Guard::Sanctum,
            self::PlatformManage, self::PlatformView => Guard::PlatformAdmin,
        };
    }
}
