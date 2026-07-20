<?php

/**
 * @file modules/notifications/notifications-mail/src/Providers/NotificationsMailServiceProvider.php
 *
 * @description
 * Root service provider for the notifications-mail module —
 * attribute-first. Every contribution is attribute-discovered by
 * the shared framework loaders. The provider itself declares just
 * the module identity and which conventional resources auto-load.
 *
 * ## Discoverables (zero code)
 *
 *   - Repositories: `#[AsRepository]` + `#[UseModel]` +
 *     `#[Cacheable]` + `#[Filterable]` on the concrete;
 *     `#[Bind]` on the interface (Pattern A per
 *     `.kiro/steering/php-attributes.md` §"Bind vs Overrides").
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Middleware: `#[AsMiddleware]` on
 *     {@see \Academorix\Notifications\Mail\Middleware\VerifyMailWebhookMiddleware}.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 47)]` composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every event class.
 *   - Observers: `#[ObservedBy]` on the model.
 *   - Policies: `#[UsePolicy]` on the model.
 *   - Channel driver: `#[AsNotificationChannel]` on
 *     {@see \Academorix\Notifications\Mail\Channels\MailChannel}.
 *     The parent notifications module's channel registry is
 *     expected to consume this attribute via its own
 *     `#[HydratesFrom]` binding when landed. Until then, the
 *     driver still self-declares its channel key + kind + feature
 *     set via the attribute so downstream wiring is deterministic.
 */

declare(strict_types=1);

namespace Academorix\Notifications\Mail\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * notifications-mail module service provider.
 *
 * Priority `26` — depends on foundation + tenancy (both at 10 or
 * lower) + notifications core (20), lands after notifications-in-app
 * (25) so the channel registry is fully populated before this
 * module registers into it.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[AsModule(name: 'NotificationsMail', priority: 26)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
    middleware: true,
)]
final class NotificationsMailServiceProvider extends ServiceProvider
{
}
