<?php

/**
 * @file modules/billing/entitlements/src/Providers/EntitlementsServiceProvider.php
 *
 * @description
 * Root service provider for the Entitlements module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on the concretes; `#[Bind]` on the interfaces.
 *   - Actions: `#[AsAction]` + verb attribute + permission requirement.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 48)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Attribute registry: `#[HydratesFrom(ConsumesEntitlement::class)]`
 *     on the registry interface's `register()` method — the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every class carrying `#[ConsumesEntitlement]` and calls
 *     `EntitlementRegistryInterface::register()` on each hit.
 */

declare(strict_types=1);

namespace Stackra\Entitlements\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Entitlements module service provider. Priority `22` — matches the
 * blueprint's `module.json`. Depends on foundation + tenancy +
 * activity + audit; consumed by every metered feature module
 * (webhook, notifications, storage, newsletter, search, ai).
 *
 * @category Entitlements
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Entitlements', priority: 22)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class EntitlementsServiceProvider extends ServiceProvider
{
}
