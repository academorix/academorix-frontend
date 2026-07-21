<?php

declare(strict_types=1);

namespace Stackra\Application\Enums;

use Stackra\Authorization\Contracts\PermissionEnum;
use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Permissions this module contributes to the `platform_admin` guard.
 *
 * Every case's backing value IS the storage key in spatie/laravel-permission's
 * `permissions` table. Discovered at boot by `stackra/authorization`'s
 * hydrator via the provider's `$permissions` array.
 *
 * The BusinessType write permissions apply ONLY to tenant-custom rows —
 * system rows (`is_system = true`) refuse writes regardless of permissions,
 * enforced by `BusinessTypeObserver` + `BusinessTypePolicy`.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ApplicationPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `applications.view-any` — list Applications. Public on the central host.
     */
    #[Label('View any Application')]
    #[Description('List every Application. Public on the central host; scoped to platform admins on the platform-admin host.')]
    case ViewAny = 'applications.view-any';

    /**
     * `applications.view` — read one Application. Public on the central host.
     */
    #[Label('View Application')]
    #[Description('Read one Application. Public on the central host.')]
    case View = 'applications.view';

    /**
     * `applications.create` — platform-admin only.
     */
    #[Label('Create Application')]
    #[Description('Create a new Application row. Platform admins only.')]
    case Create = 'applications.create';

    /**
     * `applications.update` — platform-admin only. Refuses `is_system = true` rows.
     */
    #[Label('Update Application')]
    #[Description('Update an Application. Platform admins only. Refused on `is_system = true` rows.')]
    case Update = 'applications.update';

    /**
     * `applications.delete` — soft-delete. Platform-admin only.
     */
    #[Label('Delete Application')]
    #[Description('Soft-delete (archive) an Application. Platform admins only. Refused on `is_system = true` rows.')]
    case Delete = 'applications.delete';

    /**
     * `business-types.view-any` — list BusinessTypes. Public on the central host.
     */
    #[Label('View any BusinessType')]
    #[Description('List every BusinessType. Public on the central host (self-serve signup picker); admin surface on platform-admin host.')]
    case BusinessTypeViewAny = 'business-types.view-any';

    /**
     * `business-types.view` — read one BusinessType. Public on the central host.
     */
    #[Label('View BusinessType')]
    #[Description('Read one BusinessType. Public on the central host.')]
    case BusinessTypeView = 'business-types.view';

    /**
     * `business-types.create` — create a TENANT-CUSTOM row. Platform admins may
     * create system rows only via the seeder (never HTTP).
     */
    #[Label('Create BusinessType')]
    #[Description('Create a tenant-custom BusinessType row. Platform admins never create system rows via HTTP — only via the seeder.')]
    case BusinessTypeCreate = 'business-types.create';

    /**
     * `business-types.update` — TENANT-CUSTOM rows only. System rows refuse.
     */
    #[Label('Update BusinessType')]
    #[Description('Update a tenant-custom BusinessType. System rows refuse regardless of permission (BusinessTypeObserver guardrail).')]
    case BusinessTypeUpdate = 'business-types.update';

    /**
     * `business-types.delete` — soft-delete a TENANT-CUSTOM row.
     */
    #[Label('Delete BusinessType')]
    #[Description('Soft-delete a tenant-custom BusinessType. System rows refuse.')]
    case BusinessTypeDelete = 'business-types.delete';

    /**
     * The Laravel guard this permission binds to.
     */
    public function guard(): string
    {
        return 'platform_admin';
    }
}
