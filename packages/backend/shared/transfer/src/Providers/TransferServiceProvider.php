<?php

/**
 * @file modules/shared/transfer/src/Providers/TransferServiceProvider.php
 *
 * @description
 * Root service provider for the Transfer module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on the concretes; `#[Bind]` on the interfaces.
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 44)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default `Null*` concretes; consumer apps override by binding
 *     their own concrete class through the same interface-side
 *     attribute.
 *   - Registry hydration: `#[HydratesFrom(Importable::class)]` /
 *     `#[HydratesFrom(Exportable::class)]` /
 *     `#[HydratesFrom(SampleData::class)]` on
 *     `EntityRegistryInterface::register()` — the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every model carrying those attributes and calls the
 *     registry's `register()` method with each hit.
 */

declare(strict_types=1);

namespace Stackra\Transfer\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Transfer module service provider.
 *
 * Priority `23` — after tenancy (10), audit (21), activity (20),
 * notifications (22). Downstream domain modules (billing, ai, teams,
 * athletes, ...) load at 30+ so their `HasImportable` /
 * `HasExportable` models are discovered after the hydration pump
 * populates the EntityRegistry.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Transfer', priority: 23)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class TransferServiceProvider extends ServiceProvider
{
}
