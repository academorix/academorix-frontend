<?php

/**
 * @file modules/compliance/compliance/src/Providers/ComplianceServiceProvider.php
 *
 * @description
 * Root service provider for the Compliance module — attribute-first.
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
 *   - Seeders: `#[AsSeeder]` — every seeder composes the shared
 *     `SeedsPermissionEnum` trait when it hydrates permissions.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware(alias: 'compliance.consent.gate')]` +
 *     variants for legal-hold + DSAR throttle + tenant-scope.
 *   - Attribute registries: `#[HydratesFrom]` on the registry
 *     interfaces' `register()` methods so the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every class carrying the source attribute and calls the
 *     matching registry at boot.
 */

declare(strict_types=1);

namespace Stackra\Compliance\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Compliance module service provider.
 *
 * Priority `30` — matches the blueprint's `module.json`. Depends on
 * foundation + tenancy + audit + activity + storage + entitlements +
 * notifications per the blueprint contract; consumed by every
 * downstream module that declares one of the compliance attributes
 * on a model / job / action.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Compliance', priority: 30)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class ComplianceServiceProvider extends ServiceProvider
{
}
