<?php

declare(strict_types=1);

namespace Stackra\Entitlements\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Entitlements\Enums\EntitlementsPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see EntitlementsPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `48` — after tenancy (25), domains (35), branding (36),
 * webhook (44), audit + activity (46/47). Aligned to the module's
 * priority-22 slot in the framework/billing tier.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 48, environments: [])]
final class EntitlementsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [EntitlementsPermission::class];
    }
}
