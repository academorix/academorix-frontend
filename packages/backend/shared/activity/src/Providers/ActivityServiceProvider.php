<?php

/**
 * @file modules/shared/activity/src/Providers/ActivityServiceProvider.php
 *
 * @description
 * Root service provider for the Activity module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repository: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on the concrete; `#[Bind]` on the interface.
 *   - Actions: `#[AsAction]` + verb attribute + permission requirement.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 45)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Attribute registry: `#[HydratesFrom(LoggableActivity::class)]` on
 *     the registry interface's `register()` method — the framework's
 *     {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every model carrying `#[LoggableActivity]` and calls
 *     `ActivityRegistryInterface::register()` on each hit.
 */

declare(strict_types=1);

namespace Academorix\Activity\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Activity module service provider.
 *
 * Priority `20` — depends on foundation + tenancy (both at 10 or
 * lower), lands with the shared observability modules. Downstream
 * modules (billing, ai) load at 30+ so their `HasActivityLog` models
 * are discovered after the hydration pump populates the registry.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Activity', priority: 20)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class ActivityServiceProvider extends ServiceProvider
{
}
