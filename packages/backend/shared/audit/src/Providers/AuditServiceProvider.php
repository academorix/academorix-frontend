<?php

/**
 * @file modules/shared/audit/src/Providers/AuditServiceProvider.php
 *
 * @description
 * Root service provider for the Audit module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 46)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Attribute registry: `#[HydratesFrom(Auditable::class)]` on the
 *     registry interface's `register()` method — the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every model carrying `#[Auditable]` and calls
 *     `AuditRegistryInterface::register()` on each hit.
 */

declare(strict_types=1);

namespace Stackra\Audit\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Audit module service provider.
 *
 * Priority `21` — sits between tenancy (base infrastructure) and
 * the domain modules. Depends on `foundation` + `tenancy` per the
 * module.json contract; the tenancy dependency is what lets us
 * compose `BelongsToTenantOptional` on our extended
 * {@see \Stackra\Audit\Models\Audit} model.
 *
 * @category Audit
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Audit', priority: 21)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class AuditServiceProvider extends ServiceProvider
{
}
