<?php

declare(strict_types=1);

namespace Stackra\Domains\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Domains\Enums\DomainsPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see DomainsPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `35` — after tenancy (25).
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 35, environments: [])]
final class DomainsPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [DomainsPermission::class];
    }
}
