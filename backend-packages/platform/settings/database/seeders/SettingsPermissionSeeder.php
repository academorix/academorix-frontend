<?php

declare(strict_types=1);

namespace Academorix\Settings\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Academorix\Settings\Enums\SettingsPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see SettingsPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `40` — after tenancy (25), domains (35), and branding (36),
 * matching the module's position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 40, environments: [])]
final class SettingsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [SettingsPermission::class];
    }
}
