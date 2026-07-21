<?php

/**
 * @file modules/platform/webhook/src/Providers/WebhookServiceProvider.php
 *
 * @description
 * Root service provider for the Webhook module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]`. Concrete-to-interface bindings via `#[Bind]`
 *     on the interfaces (Pattern A per `.kiro/steering/php-attributes.md`).
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 44)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware(alias: 'webhooks.verify')]`.
 *   - Signer / registries / sender / rotator / resolver: `#[Bind]` on
 *     the interfaces + `#[Singleton]` / `#[Scoped]` on the concretes.
 *   - Attribute registries: `#[HydratesFrom(AsWebhookEvent::class)]` on
 *     {@see \Stackra\Webhook\Contracts\Services\WebhookRegistryInterface::register()}
 *     and `#[HydratesFrom(AsWebhookDestination::class)]` on
 *     {@see \Stackra\Webhook\Contracts\Services\WebhookDestinationRegistryInterface::register()}
 *     — the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every class carrying the source attribute and calls
 *     `register()` on the resolved concrete.
 */

declare(strict_types=1);

namespace Stackra\Webhook\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Webhook module service provider.
 *
 * Priority `22` — matches the blueprint's `module.json`. Depends on
 * tenancy (10) for `BelongsToTenant`, on versioning for the payload
 * transformer chain (planned, feature-flag gated), and on application
 * for the tenant → application resolution surface.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Webhook', priority: 22)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class WebhookServiceProvider extends ServiceProvider
{
}
