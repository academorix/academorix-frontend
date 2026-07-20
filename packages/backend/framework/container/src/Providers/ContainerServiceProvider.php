<?php

declare(strict_types=1);

/**
 * @file packages/framework/container/src/Providers/ContainerServiceProvider.php
 *
 * @description
 * Root service provider for `academorix/container`. Its single job is
 * to run the `#[Overrides]` discovery pass at register time so every
 * class carrying that Pattern-B binding attribute is wired into the
 * container before any other module's `register()` observes the
 * abstract.
 *
 * The tagged-class discovery pass previously bundled here was
 * removed alongside the deletion of `#[Tagged]` — it had zero
 * consumers across the codebase (see `docs/adr/` history for the
 * cleanup pass). Container tagging when we need it will go through
 * Laravel's canonical `$app->tag(...)` + `#[Tag]` parameter attribute.
 *
 * @category Providers
 *
 * @since    1.0.0
 */

namespace Academorix\Container\Providers;

use Academorix\Container\Concerns\HasDiscovery;
use Academorix\ServiceProvider\Attributes\Module;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Override;

/**
 * Container module service provider.
 *
 * Priority `1` — this provider MUST run first so any downstream
 * consumer that resolves an abstract at its own `register()` phase
 * finds the override binding already registered.
 */
#[Module(name: 'Container', priority: 1)]
class ContainerServiceProvider extends ServiceProvider
{
    use HasDiscovery;

    /**
     * Register any application services.
     *
     * Discovers every class carrying
     * {@see \Academorix\Container\Attributes\Overrides} and wires
     * `$app->bind($attribute->abstract, $carrierClass)` (honouring
     * `#[Singleton]` / `#[Scoped]` lifetime markers + environment
     * filters).
     */
    #[Override]
    public function register(): void
    {
        parent::register();

        $this->discoverOverriddenClasses();
    }
}
