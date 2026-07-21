<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Tenancy\Enums\TenancyPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see TenancyPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `25` — framework/tenancy tier (between application's
 * BusinessType seeder at 20 and the domain seeders at 30+).
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 * The trait's `guardFor()` delegates to `TenancyPermission::guard()`
 * so the two-guard split (platform-catalogue vs tenant self-service)
 * is preserved.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 25, environments: [])]
final class TenancyPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [TenancyPermission::class];
    }
}
