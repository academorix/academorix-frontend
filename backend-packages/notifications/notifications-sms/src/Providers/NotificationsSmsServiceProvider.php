<?php

/**
 * @file modules/notifications/notifications-sms/src/Providers/NotificationsSmsServiceProvider.php
 *
 * @description
 * Root service provider for the notifications-sms module — attribute-first.
 *
 * ## Discoverables (zero code)
 *
 *   - Repository: `#[AsRepository]` + `#[UseModel]` + `#[Cacheable]` +
 *     `#[Filterable]`; `#[Bind]` on the interface.
 *   - Actions: `#[AsAction]` + verb attribute + `#[Middleware]` +
 *     `#[RequirePermission]`.
 *   - Console commands: `#[AsCommand]` extending `BaseCommand`.
 *   - Seeder: `#[AsSeeder(priority: 48)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observer: `#[ObservedBy]` on the model.
 *   - Policy: `#[UsePolicy]` on the model.
 *   - Provider drivers: `#[AsSmsProvider(name: '...')]` — populated into
 *     {@see \Academorix\Notifications\Sms\Contracts\Services\SmsOptOutRegistryInterface}
 *     via `#[HydratesFrom]` on the registry's `register()`.
 *   - Service implementations: interfaces carry `#[Bind]` pointing at the
 *     default concrete; consumer apps override by binding their own concrete.
 */

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * notifications-sms module service provider.
 *
 * Priority `28` — after notifications-push (27).
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[AsModule(name: 'NotificationsSms', priority: 28)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class NotificationsSmsServiceProvider extends ServiceProvider
{
}
