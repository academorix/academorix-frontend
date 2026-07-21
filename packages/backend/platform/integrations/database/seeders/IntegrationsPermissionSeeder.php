<?php

declare(strict_types=1);

namespace Stackra\Integrations\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Integrations\Enums\IntegrationsPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see IntegrationsPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `38` — after tenancy (25), domains (35), and branding
 * (36). Same tier as other domain-plane permission seeders.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 38, environments: [])]
final class IntegrationsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [IntegrationsPermission::class];
    }
}
