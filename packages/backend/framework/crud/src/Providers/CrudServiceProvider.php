<?php

declare(strict_types=1);

/**
 * @file packages/crud/src/Providers/CrudServiceProvider.php
 *
 * @description
 * Root service provider for `academorix/crud`. Auto-discovered by
 * Laravel via `composer.json`'s `extra.laravel.providers`, so
 * consumer apps get the entire wiring by simply requiring the
 * package — no manual registration in `bootstrap/providers.php`.
 *
 * ## Zero-body bindings (ADR 0006)
 *
 * Every registry this provider previously bound imperatively via
 * a `bindings()` method now carries `#[Singleton]` directly on
 * the concrete class:
 *
 *   - {@see \Academorix\Crud\Registries\CriteriaRegistry}
 *   - {@see \Academorix\Crud\Registries\ScopeRegistry}
 *   - {@see \Academorix\Crud\Registries\RepositoryConfigRegistry}
 *
 * The container reads the attribute at resolution time and
 * caches one instance per worker — same behaviour the old
 * `$this->app->singleton(...)` chain produced, but declaratively
 * on the target class where the lifetime decision belongs.
 *
 * That leaves this provider with a single responsibility:
 * scheduling the boot-time discovery pass that populates the
 * three registries.
 *
 * ## Attribute-only registration
 *
 * Every repository / criterion / scope in every package declares
 * itself via {@see \Academorix\Crud\Attributes\AsRepository},
 * {@see \Academorix\Crud\Attributes\AsCriteria}, or
 * {@see \Academorix\Crud\Attributes\AsScope}. Discovery is
 * automated end-to-end:
 *
 *   1. `composer dump-autoload` scans every autoloadable class and
 *      writes every attribute target to `vendor/attributes.php`
 *      (via `olvlvl/composer-attribute-collector`).
 *   2. This provider's boot phase invokes the discovery traits
 *      composed via {@see HasDiscovery} which iterate the collected
 *      targets, apply invariants (interface checks, duplicate-name
 *      checks, model-side attribute reads), and populate the three
 *      boot-time registries.
 *
 * ## Discovery ordering
 *
 * Criteria + scopes MUST land in their registries BEFORE
 * repositories are discovered — a repository's
 * {@see \Academorix\Crud\Attributes\UseCriteria} /
 * {@see \Academorix\Crud\Attributes\UseScope} declarations
 * reference names / class strings that need to already be
 * resolvable when the repository's config is pre-computed.
 *
 * ## Octane safety
 *
 * All registries are singletons via `#[Singleton]`, all discovery
 * runs exactly once per worker at boot, all data written to the
 * registries is immutable after the discovery pass. No static
 * state on the provider itself, no facade capture, no request
 * references.
 *
 * @see \Academorix\ServiceProvider\Providers\ServiceProvider  Base class.
 * @see \Academorix\Crud\Concerns\HasDiscovery                 Discovery workhorse.
 */

namespace Academorix\Crud\Providers;

use Academorix\Crud\Concerns\HasDiscovery;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Providers\ServiceProvider;

/**
 * Root service provider for the `academorix/crud` package.
 *
 * Zero-body class beyond the boot-time discovery hook — every
 * binding lives on the concrete class via `#[Singleton]`.
 */
#[AsModule(name: 'Crud', priority: 30)]
#[LoadsResources()]
final class CrudServiceProvider extends ServiceProvider
{
    use HasDiscovery;

    /**
     * Run the discovery passes and populate the registries at
     * boot.
     *
     * Deferred to `$this->app->booted(...)` so every other
     * package's `boot()` runs first. That guarantees the container
     * bindings each discovered artifact depends on are fully wired
     * at instantiation time.
     *
     * The internal call order matters: criteria + scopes are
     * populated FIRST so that repository discovery can reference
     * them by name / class-string in `#[UseCriteria]` /
     * `#[UseScope]` — see the class docblock's "Discovery
     * ordering" section.
     */
    #[OnBoot(priority: 100)]
    protected function scheduleDiscovery(): void
    {
        $this->app->booted(function (): void {
            // Criteria + scopes first — repositories reference
            // them by class-string / name in #[UseCriteria] +
            // #[UseScope], so their registries must be primed
            // before the repository config compiler walks the
            // attribute stack.
            $this->discoverCriteria();
            $this->discoverScopes();
            $this->discoverRepositories();
        });
    }
}
