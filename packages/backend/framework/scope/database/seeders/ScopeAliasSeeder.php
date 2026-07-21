<?php

/**
 * @file database/seeders/ScopeAliasSeeder.php
 *
 * @description
 * Demo-only seeder for {@see \Stackra\Scope\Models\ScopeAlias}.
 * Installs one alias so the demo tenant's admin UI shows the
 * word "Organisation" wherever the platform would otherwise
 * render "Owner". Real deployments choose their own labels via
 * the admin surface.
 */

declare(strict_types=1);

namespace Stackra\Scope\Database\Seeders;

use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Scope\Models\ScopeAlias;
use Stackra\Scope\Models\ScopeDefinition;
use Illuminate\Database\Seeder;

/**
 * Demo-only alias seeder.
 *
 * `priority: 120` — runs AFTER definitions + nodes so the
 * owner_id it references is already stored.
 */
#[AsSeeder(priority: 120)]
final class ScopeAliasSeeder extends Seeder
{
    public static bool $isDemoOnly = true;

    /**
     * Installs a single "Owner → Organisation" alias for the
     * demo owner. No-ops when the definition seeder didn't run.
     */
    public function run(): void
    {
        $ownerDef = ScopeDefinition::query()
            ->whereNull('parent_slug')
            ->orderBy('created_at')
            ->first();

        if ($ownerDef === null) {
            return;
        }

        ScopeAlias::factory()
            ->overrides(
                ownerId: (string) $ownerDef->owner_id,
                slug: 'owner',
                label: 'Organisation',
            )
            ->create();
    }
}
