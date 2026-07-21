<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Notifications\InApp\Enums\NotificationsInAppPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NotificationsInAppPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `46` — after tenancy (25), notifications core (45),
 * matching this module's downstream position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate`
 * loop, cache flush) lives in the shared {@see SeedsPermissionEnum}
 * trait.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 46, environments: [])]
final class NotificationsInAppPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NotificationsInAppPermission::class];
    }
}
