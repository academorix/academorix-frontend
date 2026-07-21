<?php

declare(strict_types=1);

namespace Stackra\Activity\Database\Seeders;

use Stackra\Activity\Enums\ActivityPermission;
use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see ActivityPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `45` — after tenancy (25), domains (35), and branding (36),
 * matching the module's downstream position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 45, environments: [])]
final class ActivityPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [ActivityPermission::class];
    }
}
