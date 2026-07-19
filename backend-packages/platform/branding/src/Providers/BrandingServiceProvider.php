<?php

/**
 * @file modules/platform/branding/src/Providers/BrandingServiceProvider.php
 *
 * @description
 * Root service provider for the Branding module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 36)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default `DefaultBrandingResolver` + `NullOgImageRenderer`
 *     concretes; consumer apps override by binding their own
 *     concrete class through the same interface-side attribute.
 */

declare(strict_types=1);

namespace Academorix\Branding\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Branding module service provider.
 *
 * Priority `12` — same tier as domains + integrations; depends on
 * tenancy for `BelongsToTenant`. Downstream modules that render
 * branded surfaces (settings, storage, webhook) load at 20+.
 *
 * @category Branding
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Branding', priority: 12)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class BrandingServiceProvider extends ServiceProvider
{
}
