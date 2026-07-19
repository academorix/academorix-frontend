<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Newsletter\Enums\NewsletterPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see NewsletterPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `48` — after tenancy (25), notifications core (45),
 * notifications-in-app (46), notifications-mail (47). Matches this
 * module's downstream position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate`
 * loop, cache flush) lives in the shared {@see SeedsPermissionEnum}
 * trait.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 48, environments: [])]
final class NewsletterPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [NewsletterPermission::class];
    }
}
