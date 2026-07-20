<?php

/**
 * @file packages/foundation/src/Providers/AbstractModuleServiceProvider.php
 *
 * @description
 * Base class every package's `<Name>ServiceProvider` should extend. It
 * turns a set of declarative arrays into the imperative wiring calls
 * Laravel expects — migrations, routes, config merging, policy binding,
 * middleware aliases, container bindings.
 *
 * The goal is that reading a child provider tells you the entire public
 * surface of the package at a glance:
 *
 *   final class BillingServiceProvider extends AbstractModuleServiceProvider
 *   {
 *       protected string $configKey = 'billing';
 *       protected array $configs = [__DIR__ . '/../../config/billing.php'];
 *       protected array $migrations = [__DIR__ . '/../../database/migrations'];
 *
 *       // NOTE: `$bindings` and `$singletons` MUST be `public`. The
 *       // parent widens them to public because Laravel's
 *       // `Illuminate\Support\ServiceProvider` publishes them as
 *       // public — narrowing visibility in a subclass throws a
 *       // fatal at boot ("Access level to X::$bindings must be
 *       // public"). Every other module-provider array below stays
 *       // `protected` — those are ours, not Laravel's.
 *       public array $bindings = [
 *           \Academorix\Billing\Contracts\Invoicer::class
 *               => \Academorix\Billing\Services\StripeInvoicer::class,
 *       ];
 *
 *       public array $singletons = [
 *           \Academorix\Billing\Contracts\PriceCatalog::class
 *               => \Academorix\Billing\Services\CachedPriceCatalog::class,
 *       ];
 *
 *       protected array $policies = [
 *           \Academorix\Billing\Models\Invoice::class
 *               => \Academorix\Billing\Policies\InvoicePolicy::class,
 *       ];
 *
 *       protected array $middlewareAliases = [
 *           'billing.subscribed' => \Academorix\Billing\Http\Middleware\EnsureSubscribed::class,
 *       ];
 *
 *       protected array $routes = [
 *           ['file' => __DIR__ . '/../../routes/tenant.php', 'middleware' => ['auth:sanctum']],
 *       ];
 *
 *       protected array $commands = [
 *           \Academorix\Billing\Console\SyncStripe::class,
 *       ];
 *   }
 *
 * Anything genuinely bespoke can still be added by overriding
 * `registerBespoke()` / `bootBespoke()` — they run at the end of the
 * respective lifecycle methods and are the escape hatch when the
 * declarative shape doesn't fit.
 */

declare(strict_types=1);

namespace Academorix\Foundation\Providers;

use Illuminate\Contracts\Foundation\Application;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

abstract class AbstractModuleServiceProvider extends ServiceProvider
{
    /**
     * Prefix for config merges. When set, each entry in `$configs` is
     * merged under `<configKey>.<basename-of-file>` unless the array
     * entry provides its own key.
     */
    protected string $configKey = '';

    /**
     * Container bindings: `interface => concrete` or
     * `interface => Closure`. Wired via `bind()` so each resolution
     * gets a new instance.
     *
     * ## Why this is `public` (and NOT `protected`)
     *
     * Laravel's own `Illuminate\Support\ServiceProvider` declares
     * `public array $bindings = []` and iterates the property from
     * outside the class during application boot. PHP allows widening
     * visibility in a subclass but NOT narrowing it — an override to
     * `protected` here throws a fatal at `artisan package:discover`
     * ("Cannot access protected property"). Keep this public.
     *
     * @var array<class-string, class-string|callable>
     */
    public array $bindings = [];

    /**
     * Singleton bindings — resolved once per app lifecycle.
     *
     * Same visibility rationale as {@see self::$bindings}: Laravel's
     * base `ServiceProvider` publishes this property publicly and
     * reads it during auto-registration.
     *
     * @var array<class-string, class-string|callable>
     */
    public array $singletons = [];

    /**
     * Interface tag → array of concretes. Consumers use
     * `$this->app->tagged('tag')` to iterate.
     *
     * @var array<string, list<class-string>>
     */
    protected array $tags = [];

    /**
     * Policy map: `model-class => policy-class`.
     *
     * @var array<class-string, class-string>
     */
    protected array $policies = [];

    /**
     * Middleware alias → class. Registered on the HTTP router so
     * routes can name them via `->middleware('alias')`.
     *
     * @var array<string, class-string>
     */
    protected array $middlewareAliases = [];

    /**
     * Middleware groups this package appends to. Format:
     * `['group-name' => [class, class, ...]]`.
     *
     * @var array<string, list<class-string>>
     */
    protected array $middlewareGroups = [];

    /**
     * Config file paths, or `['file' => path, 'key' => merge-key]`.
     *
     * @var list<string|array{file: string, key?: string}>
     */
    protected array $configs = [];

    /**
     * Migration directories the package owns.
     *
     * @var list<string>
     */
    protected array $migrations = [];

    /**
     * Route bundles. Each entry: `['file' => path, 'prefix' => str,
     * 'middleware' => list<string>, 'as' => str, 'namespace' => str]`.
     *
     * @var list<array{file: string, prefix?: string, middleware?: list<string>, as?: string, namespace?: string, domain?: string}>
     */
    protected array $routes = [];

    /**
     * Artisan commands owned by this package. Loaded only when the
     * app runs in the console.
     *
     * @var list<class-string>
     */
    protected array $commands = [];

    /**
     * Directories with Blade / language files.
     *
     * @var array{views?: array<string, string>, translations?: array<string, string>}
     */
    protected array $resources = [];

    public function register(): void
    {
        foreach ($this->configs as $entry) {
            [$file, $key] = $this->normaliseConfigEntry($entry);
            $this->mergeConfigFrom($file, $key);
        }

        foreach ($this->bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }

        foreach ($this->singletons as $abstract => $concrete) {
            $this->app->singleton($abstract, $concrete);
        }

        foreach ($this->tags as $tag => $classes) {
            $this->app->tag($classes, $tag);
        }

        $this->registerBespoke();
    }

    public function boot(): void
    {
        if ($this->migrations !== []) {
            foreach ($this->migrations as $directory) {
                $this->loadMigrationsFrom($directory);
            }
        }

        foreach ($this->routes as $bundle) {
            $this->loadRouteBundle($bundle);
        }

        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        if ($this->middlewareAliases !== [] || $this->middlewareGroups !== []) {
            /** @var Router $router */
            $router = $this->app->make(Router::class);

            foreach ($this->middlewareAliases as $alias => $class) {
                $router->aliasMiddleware($alias, $class);
            }

            foreach ($this->middlewareGroups as $group => $classes) {
                foreach ($classes as $class) {
                    $router->pushMiddlewareToGroup($group, $class);
                }
            }
        }

        if ($this->app->runningInConsole() && $this->commands !== []) {
            $this->commands($this->commands);
        }

        foreach ($this->resources['views'] ?? [] as $namespace => $directory) {
            $this->loadViewsFrom($directory, $namespace);
        }

        foreach ($this->resources['translations'] ?? [] as $namespace => $directory) {
            $this->loadTranslationsFrom($directory, $namespace);
        }

        $this->bootBespoke();
    }

    /** Escape hatch for register() customisations. */
    protected function registerBespoke(): void
    {
        //
    }

    /** Escape hatch for boot() customisations. */
    protected function bootBespoke(): void
    {
        //
    }

    /**
     * @param array{file: string, prefix?: string, middleware?: list<string>, as?: string, namespace?: string, domain?: string} $bundle
     */
    protected function loadRouteBundle(array $bundle): void
    {
        $group = Route::middleware($bundle['middleware'] ?? []);

        if (isset($bundle['prefix'])) {
            $group = $group->prefix($bundle['prefix']);
        }

        if (isset($bundle['as'])) {
            $group = $group->name($bundle['as']);
        }

        if (isset($bundle['domain'])) {
            $group = $group->domain($bundle['domain']);
        }

        $group->group($bundle['file']);
    }

    /**
     * @param string|array{file: string, key?: string} $entry
     *
     * @return array{0: string, 1: string}
     */
    protected function normaliseConfigEntry(string|array $entry): array
    {
        if (is_string($entry)) {
            $file = $entry;
            $basename = basename($entry, '.php');
            $key = $this->configKey !== '' ? "{$this->configKey}.{$basename}" : $basename;

            return [$file, $key];
        }

        $key = $entry['key'] ?? (
            $this->configKey !== ''
                ? $this->configKey . '.' . basename($entry['file'], '.php')
                : basename($entry['file'], '.php')
        );

        return [$entry['file'], $key];
    }

    /**
     * Keep the container / router references warm for subclasses that
     * override the lifecycle methods.
     */
    protected function app(): Application
    {
        return $this->app;
    }

    protected function httpKernel(): HttpKernel
    {
        return $this->app->make(HttpKernel::class);
    }
}
