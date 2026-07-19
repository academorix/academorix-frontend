<?php

/**
 * @file modules/notifications/newsletter/src/Providers/NewsletterServiceProvider.php
 *
 * @description
 * Root service provider for the newsletter module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 48)]` composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every event class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Services: `#[Singleton]` on the concretes + `#[Bind]` on the
 *     service interfaces.
 *
 * ## Distinct from notifications channel drivers
 *
 * This module is a CONSUMER of notifications-mail, not a channel
 * driver — it does NOT ship `#[AsNotificationChannel]` and does NOT
 * self-register with the core notifications channel registry.
 * Outbound send flows through notifications-mail's `SendMailJob`
 * from {@see \Academorix\Newsletter\Jobs\SendNewsletterIssueBatchJob}.
 */

declare(strict_types=1);

namespace Academorix\Newsletter\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Newsletter module service provider.
 *
 * Priority `30` — depends on foundation + tenancy + notifications
 * (core, 20) + notifications-mail (26) + activity + audit + settings.
 * Loads after every prerequisite so the tenant + mail + settings
 * substrates are already wired.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Newsletter', priority: 30)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class NewsletterServiceProvider extends ServiceProvider
{
}
