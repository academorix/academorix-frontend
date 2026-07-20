<?php

declare(strict_types=1);

namespace Academorix\Application\Enums;

use Academorix\Authorization\Attributes\RoleMeta;
use Academorix\Authorization\Contracts\RoleEnum;
use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Attributes\Meta;
use Academorix\Enum\Enum;

/**
 * Roles this module contributes to the `platform_admin` guard.
 *
 * `#[RoleMeta]` on every case declares the case's assigned permissions
 * — read by `academorix/authorization`'s role hydrator at boot which
 * upserts the role + syncs its permission set into spatie/laravel-permission's
 * `role_has_permissions` pivot.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum ApplicationRole: string implements RoleEnum
{
    use Enum;

    /**
     * `application-admin` — full CRUD over Applications + BusinessTypes.
     * Assigned to platform staff managing the product catalogue.
     */
    #[Label('Application Admin')]
    #[Description('Full CRUD over Applications + BusinessTypes. Platform-tier role assigned to product staff.')]
    #[RoleMeta(permissions: [
        ApplicationPermission::ViewAny,
        ApplicationPermission::View,
        ApplicationPermission::Create,
        ApplicationPermission::Update,
        ApplicationPermission::Delete,
        ApplicationPermission::BusinessTypeViewAny,
        ApplicationPermission::BusinessTypeView,
        ApplicationPermission::BusinessTypeCreate,
        ApplicationPermission::BusinessTypeUpdate,
        ApplicationPermission::BusinessTypeDelete,
    ])]
    case ApplicationAdmin = 'application-admin';

    /**
     * `application-viewer` — read-only. Support + on-call staff.
     */
    #[Label('Application Viewer')]
    #[Description('Read-only access to Applications + BusinessTypes. Assigned to support + on-call staff.')]
    #[RoleMeta(permissions: [
        ApplicationPermission::ViewAny,
        ApplicationPermission::View,
        ApplicationPermission::BusinessTypeViewAny,
        ApplicationPermission::BusinessTypeView,
    ])]
    case ApplicationViewer = 'application-viewer';

    /**
     * The Laravel guard this role binds to.
     */
    public function guard(): string
    {
        return 'platform_admin';
    }
}
