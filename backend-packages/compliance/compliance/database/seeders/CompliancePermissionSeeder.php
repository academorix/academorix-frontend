<?php

declare(strict_types=1);

namespace Academorix\Compliance\Database\Seeders;

use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\Compliance\Enums\CompliancePermission;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see CompliancePermission} cases into
 * spatie/laravel-permission's `permissions` table.
 *
 * Priority `50` — after subscription (49). Aligned to the module's
 * priority-30 slot in the compliance tier.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 50, environments: [])]
final class CompliancePermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [CompliancePermission::class];
    }
}
