<?php

/**
 * @file packages/framework/service-provider/src/Attributes/AsSeeder.php
 *
 * @description
 * Class-level marker attribute for database seeders. Discovered
 * at composer-dump time via `olvlvl/composer-attribute-collector`
 * and consumed by the shared `DatabaseSeeder` base class + a
 * planned `stackra:db:seed` artisan command.
 *
 * ## Purpose (ADR 0011)
 *
 * Every domain module ships one or more seeder classes under
 * `database/seeders/`. Historically each app's root
 * `DatabaseSeeder.php` had to explicitly `call(...)` every
 * module's seeder — a coordination burden that scaled linearly
 * with module count.
 *
 * `#[AsSeeder]` inverts that:
 *
 *   - Every seeder carries `#[AsSeeder(priority: X)]` on its
 *     class declaration.
 *   - The root `DatabaseSeeder` walks the attribute registry at
 *     seed time and dispatches each in priority order.
 *   - Adding a new module = adding a new seeder + attribute.
 *     Zero edits to any existing seeder or app-level file.
 *
 * ## Priority ordering
 *
 * Lower numbers run first. Conventions:
 *
 *   -   0..49  — foundational reference data (states, currencies,
 *                permissions).
 *   -  50..149 — normal domain (users, tenants, athletes).
 *   - 150..∞   — dependent / demo data.
 *
 * Ties broken by fully-qualified class name (alphabetical) so
 * seed order is deterministic across runs.
 *
 * ## Environments
 *
 * `environments` restricts a seeder to a subset of environments.
 * `['local', 'testing']` prevents a demo-data seeder from
 * running in production. Empty list = "any environment".
 *
 * ## Usage
 *
 * ```php
 * use Stackra\ServiceProvider\Attributes\AsSeeder;
 * use Illuminate\Database\Seeder;
 *
 * #[AsSeeder(priority: 30)]
 * final class UserSeeder extends Seeder
 * {
 *     public function run(): void
 *     {
 *         User::factory()->count(10)->create();
 *     }
 * }
 * ```
 */

declare(strict_types=1);

namespace Stackra\ServiceProvider\Attributes;

use Attribute;

/**
 * Marker attribute for database seeders.
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsSeeder
{
    /**
     * @param  int  $priority
     *                         Lower runs first. See docblock for conventions.
     * @param  list<string>  $environments
     *                                      Environments in which this seeder is allowed to run.
     *                                      Empty = any environment. Values MUST match keys of
     *                                      Laravel's `app.env` (e.g. `'local'`, `'testing'`,
     *                                      `'production'`).
     * @param  bool  $enabled
     *                         Toggle a seeder off without deleting the class — useful
     *                         for feature-flagging in-progress data seeds.
     */
    public function __construct(
        public int $priority = 100,
        public array $environments = [],
        public bool $enabled = true,
    ) {}
}
