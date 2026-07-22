<?php

/**
 * @file packages/foundation/src/Providers/FoundationServiceProvider.php
 *
 * @description
 * Package entry point for `stackra/foundation`. Owns the
 * shared-kernel wiring every other package in the monorepo depends
 * on:
 *
 *   - The `correlation-id` middleware alias — registered by the
 *     Routing package's `#[AsMiddleware]` discovery pass, driven
 *     by the attribute on
 *     {@see \Stackra\Foundation\Middleware\AssignCorrelationId}.
 *     Nothing to wire imperatively here.
 *   - The default {@see Clock} implementation
 *     ({@see SystemClock}) so packages that depend on the `Clock`
 *     contract can be swapped out for {@see \Stackra\Foundation\Support\FrozenClock}
 *     under test without a bespoke rebind.
 *   - A `RequestHandled` listener that clears the {@see CorrelationId}
 *     static accessor between requests so long-lived workers
 *     (Octane, Roadrunner, Horizon) never leak an id from one
 *     request into the next.
 *   - The `foundation::` translation namespace, which carries the
 *     `errors.php` copy that feeds the shared Blade error pages.
 *   - The `foundation::` view namespace — the shared
 *     `layouts.app` template every package's error page extends.
 *     Auto-loaded from `src/views/` via the parent's declarative
 *     `$resources` array; no manual `loadViewsFrom` call needed.
 *   - Publishing tags so downstream apps can override lang strings
 *     or the HeroUI theme CSS on a per-app basis.
 *
 * ## Middleware placement
 *
 * The correlation-id middleware is exposed as an alias rather than
 * prepended to the api group here — each app decides where in its
 * pipeline the id should live (some apps want it before CORS,
 * some after). Register from `bootstrap/app.php`:
 *
 *     $middleware->api(prepend: [
 *         \Stackra\Foundation\Middleware\AssignCorrelationId::class,
 *     ]);
 *
 * ## Publish tags
 *
 *   - `foundation-translations`  — Copies lang files to
 *                                  `lang/vendor/foundation/{locale}/*.php`.
 *   - `foundation-theme-css`     — Copies the HeroUI theme CSS to
 *                                  `public/vendor/foundation/themes/`.
 */

declare(strict_types=1);

namespace Stackra\Foundation\Providers;

use Stackra\Foundation\Contracts\Clock;
use Stackra\Foundation\Contracts\DiscoversAttributes;
use Stackra\Foundation\Discovery\AttributeDiscovery;
use Stackra\Foundation\Support\CorrelationId;
use Stackra\Foundation\Support\SystemClock;
use Illuminate\Foundation\Http\Events\RequestHandled;

final class FoundationServiceProvider extends AbstractModuleServiceProvider
{
    /**
     * Container singletons contributed by the foundation package.
     *
     *   - {@see Clock} — default is {@see SystemClock}. Tests
     *     rebind to {@see \Stackra\Foundation\Support\FrozenClock}.
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
     * {@see \Stackra\Foundation\Middleware\AssignCorrelationId}.
     * Host apps prepend it to the api middleware group in
     * `bootstrap/app.php` where placement (before CORS, after
     * auth) is app-specific.
     */
    protected array $middlewareAliases = [];

    /**
     * Declarative view + translation namespaces the parent's
     * `boot()` walks and registers via `loadViewsFrom()` +
     * `loadTranslationsFrom()`. Keeps the wiring in one place,
     * no manual imperative call inside `bootBespoke()`.
     *
     * @var array{views?: array<string, string>, translations?: array<string, string>}
     */
    protected array $resources = [
        'views' => [
            'foundation' => __DIR__ . '/../views',
        ],
        'translations' => [
            'foundation' => __DIR__ . '/../../lang',
        ],
    ];

    /**
     * Boot-time work that doesn't fit the declarative shape:
     * publishing groups + the correlation-id cleanup listener.
     * View + translation registration lives on the declarative
     * `$resources` array above.
     */
    protected function bootBespoke(): void
    {
        $this->registerCorrelationIdCleanup();
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
     * Expose publish groups so downstream apps can override
     * shipped resources without forking the package.
     */
    private function registerPublishing(): void
    {
        $this->publishes([
            __DIR__ . '/../../lang' => $this->app->langPath('vendor/foundation'),
        ], 'foundation-translations');

        $this->publishes([
            __DIR__ . '/../views' => $this->app->resourcePath('views/vendor/foundation'),
        ], 'foundation-views');

        $this->publishes([
            __DIR__ . '/../../resources/themes/heroui.css' => $this->app->publicPath('vendor/foundation/themes/heroui.css'),
        ], 'foundation-theme-css');
    }
}
