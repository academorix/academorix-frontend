<?php

declare(strict_types=1);

namespace Academorix\Branding\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Branding\Enums\BrandingPermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see BrandingPermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `36` — after tenancy (25) + domains (35).
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 36, environments: [])]
final class BrandingPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [BrandingPermission::class];
    }
}
