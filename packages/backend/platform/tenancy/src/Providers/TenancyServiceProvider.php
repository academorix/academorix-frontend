<?php

/**
 * @file modules/platform/tenancy/src/Providers/TenancyServiceProvider.php
 *
 * @description
 * Root service provider for the Tenancy domain module — attribute-
 * first end-to-end. Every contribution is attribute-discovered by
 * the shared framework loaders. The provider itself declares just
 * the module identity and which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` on the
 *     concretes; `#[Bind]` on the interfaces (Laravel-canonical
 *     placement per ADR 0006).
 *   - Actions: `#[AsAction]` + verb attribute (ADR 0016 actions-only).
 *   - Console commands: `#[AsCommand]` — auto-discovered by the
 *     base provider's `LoadsResources(commands: true)`.
 *   - Seeder: `#[AsSeeder(priority: 25)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` (discovered by `stackra/events`).
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware]` (discovered by `stackra/routing`).
 *   - Blueprint macro: `#[AsDatabaseBlueprint]` on `TenantableMacro`
 *     (auto-registered on `Blueprint` at boot by `stackra/database`).
 *   - Tenancy hooks: `#[AsTenancyHook]` on `LogContextTenantHook` +
 *     `CachePrefixTenantHook` (discovered by `stackra/service-provider`).
 *   - Retention: `#[AsRetentionPolicy]` on the Tenant model.
 *   - Service impls: `TenantContextInterface` carries `#[Bind]`
 *     pointing at `TenantContextResolver` — consumer apps override
 *     by rebinding through the same interface-side attribute.
 */

declare(strict_types=1);

namespace Stackra\Tenancy\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Tenancy module service provider.
 *
 * Priority `10` places tenancy AFTER application (priority `8`) —
 * every Tenant belongs to an Application, so the Application catalogue
 * must be hydrated first. Downstream modules (domains, branding,
 * integrations, settings, storage, webhook) load at 20+.
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Tenancy', priority: 10)]
#[LoadsResources(
    // `config/tenancy.php` — merged under the `tenancy.*` key.
    config: true,
    // `database/migrations/*.php` — loaded in the standard order.
    migrations: true,
    // Console commands are auto-discovered via `#[AsCommand]`.
    commands: true,
    // Seeders auto-loaded from `database/seeders/` — discovered by
    // `stackra/service-provider`'s `#[AsSeeder]` scanner.
    seeders: true,
    // Publishable resources (config overrides, seed scaffolding).
    publishables: true,
    // Translation strings under `lang/` are namespaced under `tenancy::`.
    translations: true,
)]
final class TenancyServiceProvider extends ServiceProvider
{
}
