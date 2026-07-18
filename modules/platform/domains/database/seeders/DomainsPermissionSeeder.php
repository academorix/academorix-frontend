<?php

declare(strict_types=1);

namespace Academorix\Domains\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Domains\Enums\DomainsPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
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
