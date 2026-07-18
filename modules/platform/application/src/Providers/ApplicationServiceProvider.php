<?php

/**
 * @file modules/platform/application/src/Providers/ApplicationServiceProvider.php
 *
 * @description
 * Root service provider for the Application domain module —
 * attribute-first end-to-end. Every contribution is attribute-
 * discovered by the shared framework loaders. The provider itself
 * declares just the module identity and which conventional resources
 * auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` on the
 *     concretes; `#[Bind]` on the interfaces (Laravel-canonical
 *     placement per ADR 0006).
 *   - Actions: `#[AsAction]` + verb attribute (ADR 0016 actions-only).
 *   - Console commands: `#[AsCommand]` — auto-discovered by the
 *     base provider's `LoadsResources(commands: true)`.
 *   - Seeder: `#[AsSeeder(priority: 20)]` on `BusinessTypeSeeder`
 *     (dual-source enum-primary catalogue seeder per ADR 0018).
 *   - Events: `#[AsEvent]` (discovered by `academorix/events`).
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware]` on `ResolveApplication`.
 *   - Blueprint macro: `#[AsDatabaseBlueprint]` on `ApplicableMacro`
 *     (auto-registered on `Blueprint` at boot by `academorix/database`).
 *   - Retention: `#[AsRetentionPolicy]` on the Application model.
 */

declare(strict_types=1);

namespace Academorix\Application\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Application module service provider.
 *
 * Priority `8` places application BEFORE tenancy (10) — every Tenant
 * belongs to an Application, so the Application catalogue must be
 * hydrated first.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Application', priority: 8)]
#[LoadsResources(
    // Config lives at `config/application.php` — merged under the
    // `application.*` key by the LoadsResources concern.
    config: true,
    // Migrations at `database/migrations/` — the base's loader picks
    // them up in the standard Laravel order.
    migrations: true,
    // Console commands are auto-discovered via `#[AsCommand]` — the
    // base's LoadsResources loop walks the attribute-collector manifest
    // and registers matching commands during console boot.
    commands: true,
    // Seeders auto-loaded from `database/seeders/` — discovered by
    // `academorix/service-provider`'s `#[AsSeeder]` scanner.
    seeders: true,
    // Publishable resources (config overrides, seed scaffolding).
    publishables: true,
    // Translation strings under `lang/` are namespaced under
    // `application::` at boot.
    translations: true,
)]
final class ApplicationServiceProvider extends ServiceProvider
{
}
