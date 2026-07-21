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
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observer: `#[ObservedBy]` on the model.
 *   - Policy: `#[UsePolicy]` on the model.
 *   - Provider drivers: `#[AsSmsProvider(name: '...')]` — populated into
 *     {@see \Stackra\Notifications\Sms\Contracts\Services\SmsOptOutRegistryInterface}
 *     via `#[HydratesFrom]` on the registry's `register()`.
 *   - Service implementations: interfaces carry `#[Bind]` pointing at the
 *     default concrete; consumer apps override by binding their own concrete.
 */

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

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
