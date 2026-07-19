<?php

/**
 * @file modules/platform/settings/src/Providers/SettingsServiceProvider.php
 *
 * @description
 * Root service provider for the Settings module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on the concretes; `#[Bind]` on the interfaces.
 *   - Services: `#[Bind]` on the interfaces (pointing at the concretes);
 *     `#[Scoped]` / `#[Singleton]` on the concretes.
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 40)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Bootstrapper: `#[AsBootstrapper(priority: 150)]` on
 *     {@see \Academorix\Settings\Bootstrappers\SettingsDiscoveryBootstrapper}
 *     — an escape-hatch multi-attribute reflection pass (reads
 *     `#[AsSetting]` + `#[SettingGroup]` + `#[SettingField]` off every
 *     settings class). The framework's meta-`BootstrapperDiscoveryBootstrapper`
 *     picks it up at boot; no provider array is required.
 */

declare(strict_types=1);

namespace Academorix\Settings\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Settings module service provider.
 *
 * Priority `22` — after tenancy (10), same tier as branding /
 * integrations / storage. Depends on tenancy for `BelongsToTenantOptional`
 * on `SettingValue`.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Settings', priority: 22)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class SettingsServiceProvider extends ServiceProvider
{
}
