<?php

declare(strict_types=1);

namespace Academorix\Geofencing\Database\Seeders;

use Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Geofencing\Enums\GeofencingPermission;
use Stackra\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see GeofencingPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `70` — matches the module priority. Runs well after tenancy (25),
 * access-control (35), and the observability tier (44-48).
 *
 * All boilerplate (spatie model resolution, updateOrCreate loop, cache flush)
 * lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 70, environments: [])]
final class GeofencingPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [GeofencingPermission::class];
    }
}
