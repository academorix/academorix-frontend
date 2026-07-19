<?php

declare(strict_types=1);

namespace Academorix\Tenancy\Enums;

use Academorix\Authorization\Attributes\RoleMeta;
use Academorix\Authorization\Concerns\HasRoleMetadata;
use Academorix\Authorization\Contracts\RoleEnum;
use Academorix\Authorization\Enums\Guard;
use Academorix\Enum\Enum;

/**
 * Roles the Tenancy module contributes to the fleet-wide access
 * catalogue.
 *
 * The {@see \Academorix\Authorization\Concerns\HasRoleMetadata}
 * trait implements the four `RoleEnum` accessors by reading each
 * case's `#[RoleMeta]` attribute — no boilerplate on the enum.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
enum TenancyRole: string implements RoleEnum
{
    use Enum;
    use HasRoleMetadata;

    /**
     * Tenant owner — unrestricted tenant-scoped access. Granted at
     * provisioning to the first user created under a new Tenant.
     * `system: true` prevents deletion / renaming from the admin UI.
     */
    #[RoleMeta(
        guard: Guard::Sanctum,
        permissions: [
            TenancyPermission::ManageOwnSettings,
            TenancyPermission::ManageContacts,
        ],
        description: 'Tenant owner — unrestricted tenant-scoped access.',
        system: true,
    )]
    case Owner = 'owner';
}
