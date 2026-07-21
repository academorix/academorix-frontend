<?php

declare(strict_types=1);

namespace Stackra\Storage\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Storage\Enums\StoragePermission;
use Illuminate\Database\Seeder;

/**
 * Seed every {@see StoragePermission} case into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `42` — after tenancy (25) + domains (35), matching the
 * module's position in the boot order.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 42, environments: [])]
final class StoragePermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [StoragePermission::class];
    }
}
