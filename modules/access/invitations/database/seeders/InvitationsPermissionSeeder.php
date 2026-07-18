<?php

declare(strict_types=1);

namespace Academorix\Invitations\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Invitations\Enums\InvitationsPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see InvitationsPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `46` — after tenancy (25), domains (35), branding (36),
 * settings (40), and activity (45), matching the module's downstream
 * position in the boot order.
 *
 * The dual-guard split (`sanctum` for tenant-scoped management,
 * `platform_admin` for the cross-tenant ManageAny case) is preserved
 * by the trait's `guardFor()` — it delegates to
 * `InvitationsPermission::guard()` on each case.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 46, environments: [])]
final class InvitationsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [InvitationsPermission::class];
    }
}
