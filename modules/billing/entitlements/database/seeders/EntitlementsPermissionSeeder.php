<?php

declare(strict_types=1);

namespace Academorix\Entitlements\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Entitlements\Enums\EntitlementsPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
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
