<?php

declare(strict_types=1);

namespace Stackra\Subscription\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Subscription\Enums\SubscriptionPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see SubscriptionPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `49` — after entitlements (48). Aligned to the module's
 * priority-29 slot in the billing tier.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 49, environments: [])]
final class SubscriptionPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [SubscriptionPermission::class];
    }
}
