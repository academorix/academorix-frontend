<?php

/**
 * @file modules/access/invitations/src/Providers/InvitationsServiceProvider.php
 *
 * @description
 * Root service provider for the Invitations module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 46)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Attribute registry: `#[HydratesFrom(Invitable::class)]` on
 *     {@see \Academorix\Invitations\Contracts\Services\InvitationTargetRegistryInterface::register()}
 *     — the framework's generic {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every model carrying `#[Invitable]` and calls the
 *     registry's `register()` method on each hit.
 *   - Retention: `#[AsRetentionPolicy]` on Invitation.
 */

declare(strict_types=1);

namespace Academorix\Invitations\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Invitations module service provider.
 *
 * Priority `26` — after tenancy (10), authorization primitives, and
 * the observability modules (activity/audit at 20-21). Downstream
 * consumer modules mark their invitable targets with `#[Invitable]`
 * so they are discovered after the invitations module boots.
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Invitations', priority: 26)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class InvitationsServiceProvider extends ServiceProvider
{
}
