<?php

/**
 * @file modules/platform/storage/src/Providers/StorageServiceProvider.php
 *
 * @description
 * Root service provider for the Storage module — attribute-first.
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
 *   - Seeder: `#[AsSeeder(priority: 42)]` — composes
 *     {@see \Stackra\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum}.
 *   - Events: `#[AsEvent]` on every class.
 *   - Observers: `#[ObservedBy]` on the models.
 *   - Policies: `#[UsePolicy]` on the models.
 *   - Service impls: `Null*` + `Default*` carry `#[Singleton]` /
 *     `#[Scoped]` on the concrete; the interfaces own the container
 *     binding via `#[Bind]`. Consumer apps override with
 *     `#[Overrides(<Interface>::class)]` on their concrete.
 *   - Retention: `#[AsRetentionPolicy]` on File.
 *   - Attribute registry: `#[HydratesFrom(FileKind::class)]` on
 *     {@see \Stackra\Storage\Contracts\Registry\FileKindRegistryInterface::register()}
 *     — the framework's
 *     {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 *     scans every class carrying `#[FileKind]` and calls
 *     `register()` on each hit.
 */

declare(strict_types=1);

namespace Stackra\Storage\Providers;

use Stackra\ServiceProvider\Attributes\AsModule;
use Stackra\ServiceProvider\Attributes\LoadsResources;
use Stackra\ServiceProvider\Providers\ServiceProvider;

/**
 * Storage module service provider.
 *
 * Priority `24` — after tenancy (10) + entitlements (~20). Every
 * package that ships file attachments depends on this.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[AsModule(name: 'Storage', priority: 24)]
#[LoadsResources(
    config: true,
    migrations: true,
    commands: true,
    seeders: true,
    publishables: true,
    translations: true,
)]
final class StorageServiceProvider extends ServiceProvider
{
}
