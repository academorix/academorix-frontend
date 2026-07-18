<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see GeographyPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `46` — after activity (45), close in the observability
 * tier. Geography is infrastructure the auth stack depends on, so it
 * runs before feature-domain modules but after the framework tier
 * (foundation / authorization / tenancy).
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate`
 * loop, cache flush) lives in the shared {@see SeedsPermissionEnum}
 * trait.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 46, environments: [])]
final class GeographyPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [GeographyPermission::class];
    }
}
