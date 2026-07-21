<?php

declare(strict_types=1);

namespace Stackra\Localization\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Localization\Enums\LocalizationPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see LocalizationPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `47` — after tenancy (25), domains (35), branding (36),
 * and activity (45), matching the module's downstream position in
 * the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate`
 * loop, cache flush) lives in the shared {@see SeedsPermissionEnum}
 * trait.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 47, environments: [])]
final class LocalizationPermissionSeeder extends Seeder
{
    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [LocalizationPermission::class];
    }

    use SeedsPermissionEnum;
}
