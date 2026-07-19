<?php

/**
 * @file modules/platform/domains/src/Providers/DomainsServiceProvider.php
 *
 * @description
 * Root service provider for the Domains module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 35)]` — composes
 *     {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: interfaces carry `#[Bind]` pointing at the
 *     default `NullDomainVerifier` + `NullCertificateProvisioner`
 *     concretes; consumer apps override by binding their own concrete
 *     class through the same interface-side attribute.
 *   - Retention: `#[AsRetentionPolicy]` on Domain.
 */

declare(strict_types=1);

namespace Academorix\Domains\Providers;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Domains module service provider.
 *
 * Priority `12` — after tenancy (10), same tier as branding +
 * integrations. Depends on tenancy for `BelongsToTenant`.
 *
 * @category Domains
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Domains', priority: 12)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class DomainsServiceProvider extends ServiceProvider
{
}
