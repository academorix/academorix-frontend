<?php

/**
 * @file modules/platform/integrations/src/Providers/IntegrationsServiceProvider.php
 *
 * @description
 * Root service provider for the Integrations module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repository: `#[AsRepository]` + `#[UseModel]` on the concrete;
 *     `#[Bind]` on the interface.
 *   - Actions: `#[AsAction]` + verb attribute + permission requirement.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 38)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]`.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Casts: `#[Cast]` on `IntegrationConfig`.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default `NullIntegrationRegistry` + `NullIntegrationSecretsCipher`
 *     concretes; consumer apps override by binding their own concrete
 *     class through the same interface-side attribute.
 */

declare(strict_types=1);

namespace Academorix\Integrations\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Integrations module service provider.
 *
 * Priority `12` — same tier as domains + branding; depends on tenancy
 * for `BelongsToTenant`.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Integrations', priority: 12)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class IntegrationsServiceProvider extends ServiceProvider
{
}
