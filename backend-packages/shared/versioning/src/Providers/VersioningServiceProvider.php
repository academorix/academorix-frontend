<?php

/**
 * @file modules/shared/versioning/src/Providers/VersioningServiceProvider.php
 *
 * @description
 * Root service provider for the Versioning module — attribute-first.
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
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware(alias: 'versioning.resolve')]`.
 *   - Service impls (registries + chain + emitter): `#[Bind]` on the
 *     interfaces (Pattern A); `#[Singleton]` / `#[Scoped]` on the
 *     concretes.
 *   - Attribute registries: `#[HydratesFrom]` on
 *     `PayloadTransformerRegistryInterface::register()` and
 *     `ApiVersionRegistryInterface::registerSurface()` — the framework's
 *     {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans `#[AsPayloadTransformer]` and `#[AsApiSurface]` at boot
 *     and dispatches to the corresponding registry method on each hit.
 *   - Version-scheme catalogue: escape-hatch
 *     {@see \Academorix\Versioning\Bootstrappers\VersionSchemeDiscoveryBootstrapper}
 *     — hardcoded two-scheme population, carries `#[AsBootstrapper]`.
 */

declare(strict_types=1);

namespace Academorix\Versioning\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Versioning module service provider.
 *
 * Priority `12` — depends only on `foundation`. Sits above tenancy
 * (10) because tenancy consumes the resolved version but not the
 * other way around.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Versioning', priority: 12)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class VersioningServiceProvider extends ServiceProvider
{
}
