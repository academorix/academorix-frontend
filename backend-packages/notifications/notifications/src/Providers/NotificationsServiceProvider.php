<?php

/**
 * @file modules/notifications/notifications/src/Providers/NotificationsServiceProvider.php
 *
 * @description
 * Root service provider for the Notifications module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 40)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default registries + resolver + gateway + scheduler concretes.
 */

declare(strict_types=1);

namespace Academorix\Notifications\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Notifications module service provider.
 *
 * Priority `20` — depends on foundation + tenancy (both at 10 or
 * lower), lands with the observability tier. Channel modules
 * (`notifications-in-app`, `notifications-mail`, `notifications-push`,
 * `notifications-sms`) load at 30+ so they discover the notifications
 * substrate's registries before hydration completes.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Notifications', priority: 20)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class NotificationsServiceProvider extends ServiceProvider
{
}
