<?php

/**
 * @file modules/notifications/notifications-push/src/Providers/NotificationsPushServiceProvider.php
 *
 * @description
 * Root service provider for the notifications-push module — attribute-first.
 * Every contribution is attribute-discovered by the shared framework loaders.
 * The provider itself declares just the module identity and which
 * conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repository: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]` +
 *     `#[Filterable]` on the concrete; `#[Bind]` on the interface.
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 47)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the model.
 *   - Policies: `#[UsePolicy]` on the model.
 *   - Provider drivers: `#[AsPushProvider(name: '...')]` — populated into
 *     {@see \Stackra\Notifications\Push\Contracts\Registry\PushSubscriptionRegistryInterface}
 *     via `#[HydratesFrom]` on the registry's `register()`.
 *   - Service implementations: interfaces carry `#[Bind]` pointing at the
 *     default concrete; consumer apps override by binding their own concrete
 *     class through the interface-side attribute.
 */

declare(strict_types=1);

namespace Stackra\Notifications\Push\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * notifications-push module service provider.
 *
 * Priority `27` — after notifications core (25) and mail (26), before SMS
 * (28). Depends on notifications core for the channel registry.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsModule(name: 'NotificationsPush', priority: 27)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class NotificationsPushServiceProvider extends ServiceProvider
{
}
