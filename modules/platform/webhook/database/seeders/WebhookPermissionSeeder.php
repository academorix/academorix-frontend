<?php

declare(strict_types=1);

namespace Academorix\Webhook\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Academorix\Webhook\Enums\WebhookPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see WebhookPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `44` — after tenancy (25), domains (35), branding (36),
 * matching the module's downstream position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 44, environments: [])]
final class WebhookPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [WebhookPermission::class];
    }
}
