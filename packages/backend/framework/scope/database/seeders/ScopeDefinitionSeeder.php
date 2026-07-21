<?php

/**
 * @file database/seeders/ScopeDefinitionSeeder.php
 *
 * @description
 * Demo-only seeder for {@see \Stackra\Scope\Models\ScopeDefinition}.
 * Production hierarchies come from the tenancy module's own
 * bootstrap when a tenant is created — never from this seeder,
 * hence the `$isDemoOnly = true` guard.
 *
 * When invoked via `php artisan db:seed --group=demo` on a local
 * dev DB, seeds a small three-level hierarchy for a single fake
 * owner so contributors can exercise `Scope::resolve()` without
 * hand-rolling fixtures.
 */

declare(strict_types=1);

namespace Stackra\Scope\Database\Seeders;

use Stackra\ServiceProvider\Attributes\AsSeeder;
use Stackra\Scope\Models\ScopeDefinition;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Demo-only definitions seeder.
 *
 * `priority: 100` — runs alongside other domain seeders, well
 * after primitive reference data (permissions, roles) at
 * priority 10-50.
 */
#[AsSeeder(priority: 100)]
final class ScopeDefinitionSeeder extends Seeder
{
    /**
     * Guard flag consumed by
     * {@see \Stackra\Database\Seeders\RunModuleSeeders} — this
     * seeder is skipped during production `db:seed` runs.
     */
    public static bool $isDemoOnly = true;

    /**
     * Seeds a demo hierarchy: owner → academy → team.
     *
     * Deliberately does NOT accept a `$count` argument — the
     * demo hierarchy is a fixed shape, not a random-count sweep.
     * Contributors who want richer trees run the factory directly
     * in their test setUp.
     */
    public function run(): void
    {
        $ownerId = (string) Str::uuid();

        // Root — every owner has one canonical top-level scope.
        ScopeDefinition::factory()
            ->forOwner($ownerId)
            ->withSlug('owner')
            ->create([
                'sort_order' => 0,
            ]);

        // Level 2 — organisational grouping under the owner.
        ScopeDefinition::factory()
            ->forOwner($ownerId)
            ->withSlug('academy')
            ->childOf('owner')
            ->create([
                'sort_order' => 10,
            ]);

        // Level 3 — operational grouping under each academy.
        ScopeDefinition::factory()
            ->forOwner($ownerId)
            ->withSlug('team')
            ->childOf('academy')
            ->create([
                'sort_order' => 20,
            ]);
    }
}
