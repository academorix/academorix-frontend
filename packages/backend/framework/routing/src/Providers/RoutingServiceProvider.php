<?php

declare(strict_types=1);

/**
 * @file packages/routing/src/Providers/RoutingServiceProvider.php
 *
 * @description
 * Root service provider for `academorix/routing`. Auto-discovered by
 * Laravel via `composer.json`'s `extra.laravel.providers`.
 *
 * ## Responsibilities
 *
 *   1. Extends {@see \Academorix\ServiceProvider\Providers\ServiceProvider}
 *      so the attribute-driven lifecycle (`#[AsModule]`,
 *      `#[LoadsResources]`, `#[OnBoot]`, `HasBindings`) is available
 *      out of the box.
 *   2. Discovers every class carrying
 *      {@see \Academorix\Routing\Attributes\AsMiddleware} via the
 *      unified {@see \Academorix\Foundation\Contracts\DiscoversAttributes}
 *      contract and registers each with Laravel's router — the
 *      alias, plus any middleware groups the attribute names.
 *
 * ## Why the middleware discovery lives here (not in
 * `academorix/service-provider`)
 *
 * `#[AsMiddleware]` is defined in this package. Its discovery
 * consumer belongs in the same package so consumer packages
 * (foundation, tenancy, ai, ...) don't need to know or care about
 * the mechanism — they just annotate their middleware class with
 * `#[AsMiddleware(alias: 'foo', groups: ['api'])]` and this
 * provider handles the rest.
 *
 * Controller discovery for `#[AsController]` runs elsewhere via
 * {@see \Academorix\Routing\RouteRegistrar} — that lifecycle is
 * separate because routes register at a specific boot phase that
 * differs from alias registration.
 *
 * @see \Academorix\Routing\Attributes\AsMiddleware  Marker attribute.
 * @see \Academorix\Foundation\Contracts\DiscoversAttributes  Discovery contract.
 */

namespace Academorix\Routing\Providers;

use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\OnBoot;
use Academorix\ServiceProvider\Providers\ServiceProvider;
use Illuminate\Routing\Router;
use Academorix\ServiceProvider\Attributes\LoadsResources;

/**
 * Routing module service provider.
 *
 * Priority 2 — loads early so route attributes, middleware
 * aliases, and BaseController helpers are available to every
 * downstream module.
 */
#[AsModule(name: 'Routing', priority: 2)]
#[LoadsResources()]
final class RoutingServiceProvider extends ServiceProvider
{
    /**
     * Discover every `#[AsMiddleware]` target and register its
     * alias + group memberships with the router.
     *
     * ## Timing
     *
     * Runs at boot (default priority 100). Every middleware alias
     * a consumer package declares lands on the router before the
     * HTTP kernel builds its pipeline, so route-level references
     * (`->middleware('api.version')`) resolve correctly on the
     * first request.
     *
     * ## Failure isolation
     *
     * The shared {@see DiscoversAttributes} implementation returns
     * an empty iterable when the composer attribute manifest hasn't
     * been primed (fresh clone, slim test harness) — no guard
     * needed here. A single broken middleware class is caught and
     * logged so it can't prevent the rest of the pass from running.
     */
    #[OnBoot(priority: 50)]
    protected function discoverMiddleware(): void
    {
        /** @var DiscoversAttributes $discovery */
        $discovery = $this->app->make(DiscoversAttributes::class);

        /** @var Router $router */
        $router = $this->app['router'];

        foreach ($discovery->forClass(AsMiddleware::class) as $target) {
            /** @var AsMiddleware $attribute */
            $attribute = $target->attribute;

            // The `enabled` flag lets a middleware ship its
            // `#[AsMiddleware]` metadata but stay out of the alias
            // registration pass — useful for feature-gated
            // middleware that's toggled by config at boot time.
            if (! $attribute->enabled) {
                continue;
            }

            try {
                // Alias the class so route-level references
                // (`->middleware('foo')`) resolve.
                $router->aliasMiddleware($attribute->alias, $target->className);

                // Push into any groups the attribute names — the
                // typical shape is `groups: ['api']` for
                // middleware that should run on every API request
                // implicitly.
                foreach ($attribute->groups as $group) {
                    $router->pushMiddlewareToGroup($group, $target->className);
                }
            } catch (\Throwable $exception) {
                // Isolate the failure — a single bad alias must
                // not blow up the entire boot sequence. Log and
                // continue; the operator will spot the error in
                // the log and fix the offending class.
                if (function_exists('logger')) {
                    logger()->error(
                        "Failed to register middleware [{$target->className}] as [{$attribute->alias}]: {$exception->getMessage()}",
                    );
                }
            }
        }
    }
}
