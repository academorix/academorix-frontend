<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Providers/ServiceProviderServiceProvider.php
 *
 * @description
 * Auto-discovered root provider for `stackra/service-provider`.
 * Its sole job is to include the composer-attribute-collector's
 * generated `vendor/attributes.php` so olvlvl's runtime
 * `Attributes::forClass(...)` / `Attributes::findTargetClasses(...)`
 * lookups have a Collection to consult.
 *
 * ## Why a wrapping provider
 *
 * The package's abstract {@see \Stackra\ServiceProvider\Providers\ServiceProvider}
 * is meant to be *extended* by consumer packages (blog, tenancy, ai,
 * etc.). Those concrete providers auto-register through Laravel's
 * standard `extra.laravel.providers` discovery. This provider is
 * different: it doesn't extend the abstract base — it's a plain
 * `Illuminate\Support\ServiceProvider` whose only responsibility is
 * to boot the olvlvl runtime for every app that requires this package.
 *
 * ## Why load the attributes file here (not via composer's `files` autoload)
 *
 * A `files` autoload entry would run at
 * `require 'vendor/autoload.php'` time — even in CI jobs / repls /
 * CLI tools that never touch attribute discovery. Doing it in a
 * provider defers the require to the point Laravel actually decides
 * to boot the service-provider package.
 *
 * The pattern here mirrors
 * {@see \Stackra\Health\Providers\HealthServiceProvider::loadAttributesFile()}
 * — same guards, same rationale.
 *
 * @see \Stackra\ServiceProvider\Providers\ServiceProvider  The abstract base consumers extend.
 * @see \Stackra\Health\Providers\HealthServiceProvider     The pattern this mirrors.
 */

namespace Stackra\ServiceProvider\Providers;

use Stackra\ServiceProvider\Console\BootstrapCacheCommand;
use Stackra\ServiceProvider\Console\BootstrapClearCommand;
use Stackra\ServiceProvider\Registry\BootstrapperRegistry;
use Illuminate\Support\ServiceProvider as BaseServiceProvider;
use olvlvl\ComposerAttributeCollector\Attributes;

final class ServiceProviderServiceProvider extends BaseServiceProvider
{
    /**
     * Register phase — includes the composer-attribute-collector's
     * generated file so its `Attributes` facade has a `Collection`
     * provider registered at runtime.
     *
     * `class_exists()` and `file_exists()` guards keep the provider
     * safe on:
     *
     *   - fresh clones before `composer install` has produced the
     *     file at all;
     *   - unusual composer `vendor-dir` overrides (in which case the
     *     consumer app should include the file themselves in
     *     bootstrap).
     */
    public function register(): void
    {
        $this->loadAttributesFile();
    }

    /**
     * Boot phase — register the framework-owned artisan commands
     * shipped by this package.
     *
     * `bootstrap:cache` + `bootstrap:clear` operate against the
     * shared {@see BootstrapperRegistry}
     * and are the operator-facing entry points for the cache
     * warming lifecycle described in
     * `.kiro/steering/bootstrappers.md`.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                BootstrapCacheCommand::class,
                BootstrapClearCommand::class,
            ]);
        }
    }

    /**
     * Include the composer-attribute-collector's generated file so
     * its {@see Attributes}
     * facade has a `Collection` provider registered at runtime.
     */
    private function loadAttributesFile(): void
    {
        // Skip when the plugin isn't installed at all.
        if (! class_exists(Attributes::class)) {
            return;
        }

        // Locate composer's vendor dir relative to the app's base path.
        $attributesFile = $this->app->basePath('vendor/attributes.php');

        if (file_exists($attributesFile)) {
            require_once $attributesFile;
        }
    }
}
