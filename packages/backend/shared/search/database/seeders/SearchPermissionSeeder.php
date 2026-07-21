<?php

declare(strict_types=1);

namespace Stackra\Search\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Stackra\Search\Enums\SearchPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see SearchPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `45` — matches the module's downstream position in the
 * boot order (same tier as activity + audit).
 *
 * All boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 45, environments: [])]
final class SearchPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [SearchPermission::class];
    }
}
