<?php

declare(strict_types=1);

/**
 * @file packages/service-provider/src/Concerns/LoadsResources.php
 *
 * @description
 * Consolidates convention-based resource loading for module
 * service providers: migrations, configuration, views (with
 * vendor overrides), and translations (with vendor overrides).
 *
 * Route loading is deliberately absent — we forbid `routes/*.php`
 * files package-wide in favour of `#[AsController]` on controllers
 * (see `.kiro/steering/package-architecture.md` §5 "Route
 * ownership"). Attempts to reintroduce a `routes/` folder in a
 * package should be caught by the `NoRoutesFolderRule` in
 * `packages/architecture`.
 *
 * Resource loading is controlled by the `#[LoadsResources]`
 * attribute — each resource is only loaded if its corresponding
 * flag is explicitly `true`. Every flag defaults to `false`.
 *
 * All path resolution uses {@see ModuleConstants} for consistent
 * directory naming.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Concerns;

use Academorix\ServiceProvider\Attributes\LoadsResources as LoadsResourcesAttribute;
use Academorix\ServiceProvider\ModuleConstants;

/**
 * Loads module resources based on `#[LoadsResources]` attribute
 * configuration.
 *
 * Provides individual load methods for each resource type, all
 * gated by `shouldLoad()` checks from the {@see ReadsAttributes}
 * trait.
 */
trait LoadsResources
{
    // -------------------------------------------------------------------------
    // Orchestration
    // -------------------------------------------------------------------------

    /**
     * Load all enabled resources based on the `#[LoadsResources]`
     * attribute.
     *
     * Called during the boot phase by
     * {@see AsModuleProvider::bootModule()}. Each resource type is
     * loaded only if its flag is true in the attribute — omitting
     * the attribute means every flag is false and nothing runs
     * here.
     */
    protected function loadResources(): void
    {
        if ($this->shouldLoad(LoadsResourcesAttribute::ATTR_MIGRATIONS)) {
            $this->loadModuleMigrations();
        }

        if ($this->shouldLoad(LoadsResourcesAttribute::ATTR_CONFIG)) {
            $this->loadModuleConfig();
        }

        if ($this->shouldLoad(LoadsResourcesAttribute::ATTR_VIEWS)) {
            $this->loadModuleViews();
        }

        if ($this->shouldLoad(LoadsResourcesAttribute::ATTR_TRANSLATIONS)) {
            $this->loadModuleTranslations();
        }
    }

    // -------------------------------------------------------------------------
    // Migrations
    // -------------------------------------------------------------------------

    /**
     * Load database migrations from the module's Migrations/ directory.
     *
     * Migrations are loaded from {moduleSourcePath}/Migrations. If the
     * directory does not exist, this method is a no-op.
     */
    protected function loadModuleMigrations(): void
    {
        $path = $this->getModuleSourcePath().'/'.ModuleConstants::DIR_MIGRATIONS;

        if (is_dir($path)) {
            $this->loadMigrationsFrom($path);
            $this->debugLog('Loaded migrations', ['path' => $path]);
        }
    }

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    /**
     * Merge every `.php` file under the module's `config/`
     * directory into the application config store.
     *
     * ## Convention
     *
     * Each file is merged under a top-level key equal to the
     * file's basename — the standard Laravel convention:
     *
     *   config/tenancy.php        →  config('tenancy.*')
     *   config/health.php         →  config('health.*')
     *   config/academorix_ai.php  →  config('academorix_ai.*')
     *
     * The old backend used a per-module `config/config.php` file
     * merged under `{slug}.config` — a non-standard nesting that
     * forced every consumer to reach through an extra key level
     * (`config('tenancy.config.resolver.strategy')`). The new
     * convention drops that nesting; consumers write plain
     * `config('tenancy.resolver.strategy')`.
     *
     * The method mirrors {@see PublishesResources::publishModuleConfig()}
     * — every published config file also gets merged, so operators
     * publishing an override see the same key surface they merged
     * against.
     *
     * When the module's `config/` directory is missing this method
     * is a no-op. Packages that ship no runtime config simply omit
     * the directory.
     */
    protected function loadModuleConfig(): void
    {
        $configDir = $this->getModulePath().'/'.ModuleConstants::DIR_CONFIG;

        if (! is_dir($configDir)) {
            return;
        }

        $configFiles = glob($configDir.'/*.php') ?: [];

        foreach ($configFiles as $configFile) {
            $mergeKey = pathinfo($configFile, PATHINFO_FILENAME);
            $this->mergeConfigFrom($configFile, $mergeKey);
            $this->debugLog('Loaded config', ['path' => $configFile, 'key' => $mergeKey]);
        }
    }

    // -------------------------------------------------------------------------
    // Views (with vendor overrides)
    // -------------------------------------------------------------------------

    /**
     * Load Blade views from the module's views/ directory.
     *
     * Views are namespaced with the module slug (e.g. 'tenancy::dashboard').
     * Supports vendor overrides: files in views/vendor/{package}/ are
     * registered as overrides for the {package} view namespace.
     *
     * If the views directory does not exist, this method is a no-op.
     */
    protected function loadModuleViews(): void
    {
        $viewsPath = $this->getModuleSourcePath().'/'.ModuleConstants::DIR_VIEWS;

        if (! is_dir($viewsPath)) {
            return;
        }

        $namespace = $this->getModuleAttribute()?->{Module::ATTR_VIEW_NAMESPACE}
            ?? $this->getModuleSlug();

        // Register vendor view overrides (views/vendor/{package}/)
        $this->registerVendorViewOverrides($viewsPath);

        // Register module's own views with namespace
        $this->loadViewsFrom($viewsPath, $namespace);
        $this->debugLog('Loaded views', ['namespace' => $namespace, 'path' => $viewsPath]);
    }

    /**
     * Register vendor view overrides from views/vendor/{package}/ directories.
     *
     * Each subdirectory in views/vendor/ is treated as an override for the
     * corresponding package's view namespace. This allows modules to customize
     * third-party package views without modifying the package source.
     *
     * @param  string  $viewsPath  The absolute path to the module's views/ directory.
     */
    protected function registerVendorViewOverrides(string $viewsPath): void
    {
        $vendorPath = $viewsPath.'/'.ModuleConstants::DIR_VENDOR;

        if (! is_dir($vendorPath)) {
            return;
        }

        $vendorDirs = array_filter(
            scandir($vendorPath) ?: [],
            fn (string $dir): bool => $dir !== '.' && $dir !== '..' && is_dir($vendorPath.'/'.$dir),
        );

        foreach ($vendorDirs as $packageName) {
            $this->loadViewsFrom($vendorPath.'/'.$packageName, $packageName);
            $this->debugLog("Loaded vendor view overrides for '{$packageName}'");
        }
    }

    // -------------------------------------------------------------------------
    // Translations (with vendor overrides)
    // -------------------------------------------------------------------------

    /**
     * Load translation files from the module's i18n/ directory.
     *
     * Translations are namespaced with the module slug (e.g. 'tenancy::messages.key').
     * Supports vendor overrides: files in i18n/vendor/{package}/ are registered
     * as overrides for the {package} translation namespace, and re-registered
     * after all providers boot to ensure override precedence.
     *
     * If the i18n directory does not exist, this method is a no-op.
     */
    protected function loadModuleTranslations(): void
    {
        $langPath = $this->getModuleSourcePath().'/'.ModuleConstants::DIR_I18N;

        if (! is_dir($langPath)) {
            return;
        }

        $namespace = $this->getModuleAttribute()?->{Module::ATTR_TRANSLATION_NAMESPACE}
            ?? $this->getModuleSlug();

        // Register vendor translation overrides (i18n/vendor/{package}/)
        $this->registerVendorTranslationOverrides($langPath);

        // Register module's own translations with namespace
        $this->loadTranslationsFrom($langPath, $namespace);
        $this->debugLog('Loaded translations', ['namespace' => $namespace, 'path' => $langPath]);
    }

    /**
     * Register vendor translation overrides from i18n/vendor/{package}/ directories.
     *
     * Each subdirectory in i18n/vendor/ is treated as an override for the
     * corresponding package's translation namespace. Overrides are re-registered
     * after all providers boot to ensure they take precedence over the original
     * package translations.
     *
     * @param  string  $langPath  The absolute path to the module's i18n/ directory.
     */
    protected function registerVendorTranslationOverrides(string $langPath): void
    {
        $vendorPath = $langPath.'/'.ModuleConstants::DIR_VENDOR;

        if (! is_dir($vendorPath)) {
            return;
        }

        $vendorDirs = array_filter(
            scandir($vendorPath) ?: [],
            fn (string $dir): bool => $dir !== '.' && $dir !== '..' && is_dir($vendorPath.'/'.$dir),
        );

        foreach ($vendorDirs as $packageName) {
            $packageLangPath = $vendorPath.'/'.$packageName;

            // Register immediately for early access
            $this->loadTranslationsFrom($packageLangPath, $packageName);

            // Re-register after all providers boot to ensure override precedence
            $this->app->booted(function () use ($packageName, $packageLangPath): void {
                if ($this->app->bound('translator')) {
                    $this->app->make('translator')->addNamespace($packageName, $packageLangPath);
                }
            });

            $this->debugLog("Loaded vendor translation overrides for '{$packageName}'");
        }
    }
}
