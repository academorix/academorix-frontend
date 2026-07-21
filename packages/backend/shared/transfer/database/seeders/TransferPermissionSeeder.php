<?php

declare(strict_types=1);

namespace Stackra\Transfer\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Transfer\Enums\TransferPermission;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see TransferPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `44` — after tenancy (25), domains (35), branding (36),
 * activity (45 lands after us intentionally to keep read-only
 * observability behind write-capable transfer).
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 44, environments: [])]
final class TransferPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [TransferPermission::class];
    }
}
