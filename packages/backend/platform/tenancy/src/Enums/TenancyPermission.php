<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Enums;

use Academorix\Authorization\Contracts\PermissionEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Permissions the Tenancy module contributes.
 *
 * Cases split across two guards — the platform-admin catalogue
 * permissions ({@see self::View}, {@see self::Manage}) target the
 * `platform_admin` guard; the tenant self-service permissions
 * ({@see self::ManageOwnSettings}, {@see self::ManageContacts})
 * target the `sanctum` guard.
 *
 * The `->value` of every case is the storage key written to
 * spatie/laravel-permission's `permissions` table by the access
 * hydrator. Names follow `{domain}.{aggregate}.{action}` per
 * ADR-0009.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TenancyPermission: string implements PermissionEnum
{
    use Enum;

    /**
     * `tenancy.tenant.view` — read-only access to the tenant directory.
     * Granted to platform support staff.
     */
    #[Label('View Tenants')]
    #[Description('Read-only access to the tenant directory. Granted to platform support staff.')]
    case View = 'tenancy.tenant.view';

    /**
     * `tenancy.tenant.manage` — full lifecycle management (provision,
     * suspend, resume, archive, delete). Platform admins only.
     */
    #[Label('Manage Tenants')]
    #[Description('Full lifecycle management of tenants — provision, suspend, resume, archive, delete.')]
    case Manage = 'tenancy.tenant.manage';

    /**
     * `tenancy.tenant.manage_own_settings` — tenant admin updates own
     * tenant (name, branding pointer, feature toggles). Sanctum guard.
     */
    #[Label('Manage Own Tenant Settings')]
    #[Description('Tenant admin editing their own tenant via PATCH /api/current-tenant. Refuses if the caller is on a different tenant.')]
    case ManageOwnSettings = 'tenancy.tenant.manage_own_settings';

    /**
     * `tenancy.contact.manage` — tenant admin manages the tenant's
     * named contacts (billing / legal / DPO / support). Sanctum guard.
     */
    #[Label('Manage Tenant Contacts')]
    #[Description('Manage named tenant contacts (billing / legal / DPO / technical / security / support / owner). GDPR Art. 30 ROPA requirement for DPO + legal kinds.')]
    case ManageContacts = 'tenancy.contact.manage';

    /**
     * The Laravel guard this permission binds to. Platform-catalogue
     * permissions target `platform_admin`; tenant self-service
     * permissions target `sanctum`.
     */
    public function guard(): Guard
    {
        return match ($this) {
            self::View, self::Manage                            => Guard::PlatformAdmin,
            self::ManageOwnSettings, self::ManageContacts       => Guard::Sanctum,
        };
    }
}
