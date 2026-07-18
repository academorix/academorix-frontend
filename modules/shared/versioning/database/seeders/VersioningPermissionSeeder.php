<?php

declare(strict_types=1);

namespace Academorix\Versioning\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Academorix\Versioning\Enums\VersioningPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see VersioningPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `44` — after tenancy (25) + application (35). Both
 * versioning permissions land on the platform_admin guard.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 44, environments: [])]
final class VersioningPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [VersioningPermission::class];
    }
}
