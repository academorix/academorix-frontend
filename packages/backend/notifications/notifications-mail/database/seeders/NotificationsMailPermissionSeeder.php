<?php

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Notifications\Mail\Enums\NotificationsMailPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NotificationsMailPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `47` — after tenancy (25), notifications core (45), and
 * notifications-in-app (46), matching this module's downstream
 * position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate`
 * loop, cache flush) lives in the shared {@see SeedsPermissionEnum}
 * trait.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 47, environments: [])]
final class NotificationsMailPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NotificationsMailPermission::class];
    }
}
