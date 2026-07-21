<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Enums;

use Stackra\Authorization\Attributes\RoleMeta;
use Stackra\Authorization\Concerns\HasRoleMetadata;
use Stackra\Authorization\Contracts\RoleEnum;
use Stackra\Authorization\Enums\Guard;
use Stackra\Enum\Enum;

/**
 * Roles the Tenancy module contributes to the fleet-wide access
 * catalogue.
 *
 * The {@see \Stackra\Authorization\Concerns\HasRoleMetadata}
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
