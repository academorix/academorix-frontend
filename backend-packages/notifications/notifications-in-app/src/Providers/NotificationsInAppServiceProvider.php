<?php

/**
 * @file modules/notifications/notifications-in-app/src/Providers/NotificationsInAppServiceProvider.php
 *
 * @description
 * Root service provider for the notifications-in-app module —
 * attribute-first. Every contribution is attribute-discovered by the
 * shared framework loaders. The provider itself declares just the
 * module identity and which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]`
 *     on the concretes; `#[Bind]` on the interfaces (Pattern A per
 *     `.kiro/steering/php-attributes.md` §"Bind vs Overrides").
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 46)]` composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Channel driver: `#[AsNotificationChannel]` on {@see \Academorix\Notifications\InApp\Channels\InAppChannel}.
 *     The parent notifications module's channel registry is expected
 *     to consume this attribute via its own `#[HydratesFrom]` binding
 *     when landed. Until then, the driver still self-declares its
 *     channel key + kind + feature set via the attribute so downstream
 *     wiring is deterministic.
 */

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * notifications-in-app module service provider.
 *
 * Priority `25` — depends on foundation + tenancy (both at 10 or
 * lower) + notifications core (`20`), lands right after the parent
 * module so the channel registry is fully populated before this
 * module registers into it.
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
#[AsModule(name: 'NotificationsInApp', priority: 25)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class NotificationsInAppServiceProvider extends ServiceProvider
{
}
