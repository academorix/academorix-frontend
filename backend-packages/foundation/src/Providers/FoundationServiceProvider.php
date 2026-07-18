<?php

/**
 * @file packages/foundation/src/Providers/FoundationServiceProvider.php
 *
 * @description
 * Package entry point for `academorix/foundation`. Owns the
 * shared-kernel wiring every other package in the monorepo depends
 * on:
 *
 *   - The `correlation-id` middleware alias — registered by the
 *     Routing package's `#[AsMiddleware]` discovery pass, driven
 *     by the attribute on
 *     {@see \Academorix\Foundation\Http\Middleware\AssignCorrelationId}.
 *     Nothing to wire imperatively here.
 *   - The default {@see Clock} implementation
 *     ({@see SystemClock}) so packages that depend on the `Clock`
 *     contract can be swapped out for {@see \Academorix\Foundation\Support\FrozenClock}
 *     under test without a bespoke rebind.
 *   - A `RequestHandled` listener that clears the {@see CorrelationId}
 *     static accessor between requests so long-lived workers
 *     (Octane, Roadrunner, Horizon) never leak an id from one
 *     request into the next.
 *   - The `foundation::` view namespace, containing the shared
 *     `layouts.app` template used by the Blade error pages and any
 *     app-owned marketing / error views.
 *   - The `foundation::` translation namespace, containing the
 *     `errors.php` copy consumed by the Blade error pages.
 *   - Publishing tags so downstream apps can override views, lang
 *     strings, or the HeroUI theme CSS on a per-app basis.
 *
 * ## Middleware placement
 *
 * The correlation-id middleware is exposed as an alias rather than
 * prepended to the api group here — each app decides where in its
 * pipeline the id should live (some apps want it before CORS,
 * some after). Register from `bootstrap/app.php`:
 *
 *     $middleware->api(prepend: [
 *         \Academorix\Foundation\Http\Middleware\AssignCorrelationId::class,
 *     ]);
 *
 * ## Publish tags
 *
 *   - `foundation-views`         — Copies Blade templates to
 *                                  `resources/views/vendor/foundation`.
 *   - `foundation-translations`  — Copies lang files to
 *                                  `lang/vendor/foundation/{locale}/*.php`.
 *   - `foundation-theme-css`     — Copies the HeroUI theme CSS to
 *                                  `public/vendor/foundation/themes/`.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Providers;

use Academorix\Foundation\Contracts\Clock;
use Academorix\Foundation\Contracts\DiscoversAttributes;
use Academorix\Foundation\Discovery\AttributeDiscovery;
use Academorix\Foundation\Support\CorrelationId;
use Academorix\Foundation\Support\SystemClock;
use Illuminate\Foundation\Http\Events\RequestHandled;

final class FoundationServiceProvider extends AbstractModuleServiceProvider
{
    /**
     * Container singletons contributed by the foundation package.
     *
     *   - {@see Clock} — default is {@see SystemClock}. Tests
     *     rebind to {@see \Academorix\Foundation\Support\FrozenClock}.
     *   - {@see DiscoversAttributes} — the compile-time
     *     attribute-discovery contract. Every consumer (routing,
     *     events, ai, crud, scheduling) resolves this to look up
     *     "which classes carry attribute X?". The production
     *     binding delegates to `olvlvl/composer-attribute-collector`;
     *     tests bind an in-memory fake with fixture data.
     *
     * @var array<class-string, class-string|callable>
     */
    public array $singletons = [
        Clock::class => SystemClock::class,
        DiscoversAttributes::class => AttributeDiscovery::class,
    ];

    /**
     * Middleware placement note.
     *
     * The `correlation-id` alias is registered by the Routing
     * package's `#[AsMiddleware]` discovery pass — see
     * {@see \Academorix\Foundation\Http\Middleware\AssignCorrelationId}.
     * Host apps prepend it to the api middleware group in
     * `bootstrap/app.php` where placement (before CORS, after
     * auth) is app-specific.
     */
    protected array $middlewareAliases = [];

    /**
     * Boot-time work that doesn't fit the declarative shape:
     * translation + view namespace loading, publishing groups, and
     * the correlation-id cleanup listener.
     *
     * Every operation is idempotent so re-running the boot (e.g.
     * inside an Octane worker's boot cycle) is safe.
     */
    protected function bootBespoke(): void
    {
        $this->registerCorrelationIdCleanup();
        $this->registerResourceLoaders();
        $this->registerPublishing();
    }

    /**
     * Attach a listener that clears the static
     * {@see CorrelationId::forget()} accessor after every request.
     *
     * Necessary for long-lived workers (Octane / Roadrunner /
     * Horizon) where the framework container survives across
     * requests — without this the next request would see the
     * previous request's correlation id when it calls
     * {@see CorrelationId::current()}.
     */
    private function registerCorrelationIdCleanup(): void
    {
        $this->app['events']->listen(RequestHandled::class, [self::class, 'onRequestHandled']);
    }

    /**
     * Static event handler for {@see RequestHandled}. Kept as a
     * named method rather than a closure so the listener registers
     * as a callable string, staying serialisable across Octane
     * worker restarts.
     */
    public static function onRequestHandled(RequestHandled $event): void
    {
        unset($event);
        CorrelationId::forget();
    }

    /**
     * Register the `foundation::` view + translation namespaces
     * so consumers can reference `foundation::layouts.app` and
     * `foundation::errors.500_title`.
     */
    private function registerResourceLoaders(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../../views', 'foundation');
        $this->loadTranslationsFrom(__DIR__ . '/../../lang', 'foundation');
    }

    /**
     * Expose publish groups so downstream apps can override
     * shipped resources without forking the package.
     *
     * The HeroUI theme CSS ships as a static asset because the
     * shared Blade layout references it via `<link>` from
     * `public/vendor/foundation/themes/heroui.css`.
     */
    private function registerPublishing(): void
    {
        $this->publishes([
            __DIR__ . '/../../views' => $this->app->resourcePath('views/vendor/foundation'),
        ], 'foundation-views');

        $this->publishes([
            __DIR__ . '/../../lang' => $this->app->langPath('vendor/foundation'),
        ], 'foundation-translations');

        $this->publishes([
            __DIR__ . '/../../resources/themes/heroui.css' => $this->app->publicPath('vendor/foundation/themes/heroui.css'),
        ], 'foundation-theme-css');
    }
}
