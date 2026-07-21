<?php

declare(strict_types=1);

namespace Stackra\Notifications\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Notifications\Enums\NotificationsPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NotificationsPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `40` — after tenancy (25) + domains (35), matching the
 * module's downstream position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 40, environments: [])]
final class NotificationsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NotificationsPermission::class];
    }
}
