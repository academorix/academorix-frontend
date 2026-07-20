<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Notifications\Sms\Enums\NotificationsSmsPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NotificationsSmsPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `48` — after notifications-push (47).
 *
 * All boilerplate (spatie model resolution, updateOrCreate loop, cache flush)
 * lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 48, environments: [])]
final class NotificationsSmsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NotificationsSmsPermission::class];
    }
}
