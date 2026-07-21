<?php

/**
 * @file modules/products/geofencing/src/Providers/GeofencingServiceProvider.php
 *
 * @description
 * Root service provider for the geofencing module — attribute-first.
 *
 * ## Discoverables (zero code)
 *
 *   - Repository: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]` +
 *     `#[Filterable]` on the concrete; `#[Bind]` on the interface.
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 70)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observer: `#[ObservedBy]` on the model.
 *   - Policy: `#[UsePolicy]` on the model.
 *   - Fenceable models: `#[Geofenceable(alias: '...')]` — populated into
 *     Laravel's morph map at boot (compile-time discovery pipeline in a
 *     follow-up).
 *   - Subject models: `#[GeofenceSubjectAlias(alias: '...')]` — same pipeline.
 *   - Service implementations: interfaces carry `#[Bind]` pointing at the
 *     default concrete; consumer apps override by binding their own concrete.
 */

declare(strict_types=1);

namespace Academorix\Geofencing\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Geofencing module service provider.
 *
 * Priority `70` — matches the blueprint's `module.json`. Runs after every
 * tenant-scoped infrastructure module but before consumer packages that
 * will subscribe to `GeofenceEvaluated`.
 *
 * @category Geofencing
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Geofencing', priority: 70)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class GeofencingServiceProvider extends ServiceProvider
{
}
