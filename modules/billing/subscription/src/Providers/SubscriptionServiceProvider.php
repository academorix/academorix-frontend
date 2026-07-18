<?php

/**
 * @file modules/billing/subscription/src/Providers/SubscriptionServiceProvider.php
 *
 * @description
 * Root service provider for the Subscription module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework
 * loaders. The provider itself declares just the module identity and
 * which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     + `#[Filterable]` on the concretes; `#[Bind]` on the interfaces
 *     (Pattern A per `.kiro/steering/php-attributes.md`).
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 49)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Middleware: `#[AsMiddleware(alias: 'subscription.active')]` +
 *     `#[AsMiddleware(alias: 'subscription.state')]`.
 *   - Services (billing / dunning / grace-period / registry): `#[Bind]`
 *     on the interfaces + `#[Singleton]`/`#[Scoped]` on the concretes.
 */

declare(strict_types=1);

namespace Academorix\Subscription\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Subscription module service provider.
 *
 * Priority `29` — matches the blueprint's `module.json`. Depends on
 * foundation + tenancy + entitlements + activity + audit + notifications
 * per the blueprint contract; consumed by every downstream module that
 * gates behaviour on subscription state (via the `subscription.active`
 * and `subscription.state` middleware aliases).
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Subscription', priority: 29)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class SubscriptionServiceProvider extends ServiceProvider
{
}
