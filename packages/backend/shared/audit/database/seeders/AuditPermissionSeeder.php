<?php

declare(strict_types=1);

namespace Academorix\Audit\Database\Seeders;

use Academorix\Audit\Enums\AuditPermission;
use Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum;
use Academorix\ServiceProvider\Attributes\AsSeeder;
use Illuminate\Database\Seeder;

/**
 * Seed the {@see AuditPermission} cases into spatie/laravel-permission's
 * `permissions` table.
 *
 * Priority `46` — after tenancy (25), domains (35), and branding
 * (36). No dependency on other permission seeders; audit permissions
 * are self-contained.
 *
 * All the boilerplate (spatie model resolution, `updateOrCreate` loop,
 * cache flush) lives in the shared {@see SeedsPermissionEnum} trait.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsSeeder(priority: 46, environments: [])]
final class AuditPermissionSeeder extends Seeder
{
    use SeedsPermissionEnum;

    /**
     * {@inheritDoc}
     */
    protected function permissionEnums(): array
    {
        return [AuditPermission::class];
    }
}
