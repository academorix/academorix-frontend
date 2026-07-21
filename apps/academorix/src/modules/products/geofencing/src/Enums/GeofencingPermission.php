<?php

declare(strict_types=1);

namespace Stackra\Geofencing\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions the geofencing module contributes.
 *
 * Split across the two guards — tenant users hit preflight + request
 * overrides via `sanctum`; platform staff have cross-tenant observability +
 * retention-purge via `platform_admin`.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum GeofencingPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * Call `POST /api/v1/geofence/preflight`. Rate-limited to 60/min.
     */
    #[Label('Preflight Geofence')]
    #[Description('Call the mobile pre-flight probe endpoint. Rate-limited to 60/min per user.')]
    case Preflight = 'geofence.preflight';

    /**
     * Request an admin override on a rejected check.
     */
    #[Label('Request Geofence Override')]
    #[Description('Request an admin override on a rejected geofence check.')]
    case OverridesRequest = 'geofence.overrides.request';

    /**
     * List geofence checks for the current tenant.
     */
    #[Label('List Geofence Checks')]
    #[Description('List every geofence check for the current tenant. Regular users see only their own subject.')]
    case ChecksViewAny = 'geofence.checks.viewAny';

    /**
     * Read a single geofence check.
     */
    #[Label('View Geofence Check')]
    #[Description('Read a single geofence check row.')]
    case ChecksView = 'geofence.checks.view';

    /**
     * Read the fence geometry on a fenceable model.
     */
    #[Label('View Fence Geometry')]
    #[Description('Read the polygon / radius on any Geofenceable model.')]
    case FencesView = 'geofence.fences.view';

    /**
     * Update the fence geometry on a fenceable model.
     */
    #[Label('Update Fence Geometry')]
    #[Description('Edit the polygon / radius / enforcement toggle on any Geofenceable model.')]
    case FencesUpdate = 'geofence.fences.update';

    /**
     * Platform admin — cross-tenant read of every check.
     */
    #[Label('View Geofence Checks (platform)')]
    #[Description('Cross-tenant read-only access to every geofence check. Platform staff.')]
    case PlatformChecksViewAny = 'platform.geofence.checks.viewAny';

    /**
     * Platform admin — read a single cross-tenant check.
     */
    #[Label('View Geofence Check (platform)')]
    #[Description('Cross-tenant read of a single geofence check. Platform staff.')]
    case PlatformChecksView = 'platform.geofence.checks.view';

    /**
     * Platform admin — list every override across all tenants (compliance).
     */
    #[Label('View Geofence Overrides (platform)')]
    #[Description('Cross-tenant list of every override — compliance surface.')]
    case PlatformOverridesViewAny = 'platform.geofence.overrides.viewAny';

    /**
     * Platform admin — GDPR retention path. Every call is audit-logged.
     */
    #[Label('Purge Geofence Check (platform)')]
    #[Description('GDPR retention path — soft-delete a specific geofence check. Every use audit-logged.')]
    case PlatformChecksPurge = 'platform.geofence.checks.purge';

    /**
     * Which Laravel guard this permission binds to.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::Preflight,
            self::OverridesRequest,
            self::ChecksViewAny,
            self::ChecksView,
            self::FencesView,
            self::FencesUpdate               => Guard::Sanctum,

            self::PlatformChecksViewAny,
            self::PlatformChecksView,
            self::PlatformOverridesViewAny,
            self::PlatformChecksPurge        => Guard::PlatformAdmin,
        };
    }
}
