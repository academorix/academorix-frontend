<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Notifications\Push\Enums\NotificationsPushPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NotificationsPushPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `47` — after notifications core (46).
 *
 * All boilerplate (spatie model resolution, updateOrCreate loop, cache flush)
 * lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 47, environments: [])]
final class NotificationsPushPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NotificationsPushPermission::class];
    }
}
