<?php

/**
 * @file modules/shared/search/src/Providers/SearchServiceProvider.php
 *
 * @description
 * Root service provider for the Search module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 45)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default concrete implementations; consumer apps override by
 *     binding their own concrete class through the same
 *     interface-side attribute.
 *   - Attribute registry: `#[HydratesFrom(Searchable::class)]` on
 *     the {@see \Academorix\Search\Contracts\Services\EngineRegistryInterface::register()}
 *     method — the framework scans every model carrying `#[Searchable]`
 *     and calls the registry on each hit.
 */

declare(strict_types=1);

namespace Academorix\Search\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Search module service provider.
 *
 * Priority `24` — depends on foundation + tenancy + activity + audit +
 * notifications + settings. Lands with the shared cross-cutting
 * modules.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Search', priority: 24)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class SearchServiceProvider extends ServiceProvider
{
}
