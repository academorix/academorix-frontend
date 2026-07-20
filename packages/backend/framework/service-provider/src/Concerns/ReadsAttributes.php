<?php

declare(strict_types=1);

/**
 * ReadsAttributes Trait.
 *
 * Reads the #[AsModule] and #[LoadsResources] attributes from the
 * composer-attribute-collector cached file via olvlvl's
 * `Attributes::forClass()`. Zero runtime reflection in hot paths —
 * attributes are resolved once during registerModule() and cached for
 * the bootModule() phase.
 *
 * When #[AsModule] is absent (third-party base providers), module identity
 * is auto-derived from the provider class name:
 *   - Academorix\Horizon\Providers\HorizonServiceProvider
 *     → name: 'Horizon', namespace: 'Academorix\Horizon'
 *
 * No properties ($moduleName, $moduleNamespace) need to be set manually.
 *
 * The old backend used `Academorix\Support\Reflection` for its class-basename
 * and file-name helpers. This port inlines equivalent `\ReflectionClass`
 * calls — the monorepo has no shared reflection utility (yet) and pulling
 * one in for two callsites would be over-engineering.
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Concerns;

use Academorix\ServiceProvider\Attributes\AsModule;
use Academorix\ServiceProvider\Attributes\LoadsResources;
use olvlvl\ComposerAttributeCollector\Attributes;

/**
 * Reads #[AsModule] and #[LoadsResources] from cached attributes.
 *
 * Provides module identity accessors (name, namespace, path, slug, priority)
 * and resource configuration checks via shouldLoad(). All identity is
 * derived from the #[AsModule] attribute or auto-generated from the class name.
 */
trait ReadsAttributes
{
    // =========================================================================
    // Instance State (Octane-safe — no static properties)
    // =========================================================================

    /**
     * Cached #[AsModule] attribute instance. Null when absent.
     */
    private ?Module $moduleAttribute = null;

    /**
     * Cached #[LoadsResources] attribute instance. Null when absent.
     */
    private ?LoadsResources $resourcesAttribute = null;

    /**
     * Whether attributes have been resolved.
     */
    private bool $attributesResolved = false;

    /**
     * Resolved module name (PascalCase, e.g. 'Tenancy').
     */
    private string $resolvedModuleName = '';

    /**
     * Resolved module PSR-4 namespace (e.g. 'Academorix\Tenancy').
     */
    private string $resolvedModuleNamespace = '';

    /**
     * Resolved absolute filesystem path to the module root.
     */
    private ?string $resolvedModulePath = null;

    // =========================================================================
    // Attribute Resolution
    // =========================================================================

    /**
     * Resolve all attributes from the cached attribute collector.
     *
     * Called once during registerModule() and short-circuits on subsequent
     * calls. Reads #[AsModule] and #[LoadsResources] from the cached
     * collector — zero runtime reflection for attribute reading.
     *
     * When #[AsModule] is present, reads name/namespace from the attribute.
     * When absent, auto-derives from the provider class name:
     *   - Name: class basename minus 'ServiceProvider' suffix
     *   - Namespace: class namespace minus '\Providers' suffix
     */
    protected function resolveAttributes(): void
    {
        if ($this->attributesResolved) {
            return;
        }

        $this->attributesResolved = true;

        // Read class-level attributes from the cached collector.
        // Falls back gracefully if the attribute collector isn't initialized yet
        // (e.g., during early boot before autoload files are processed).
        try {
            $forClass = Attributes::forClass(static::class);
        } catch (\LogicException) {
            // Attribute collector not ready — fall back to runtime reflection
            $ref = new \ReflectionClass(static::class);
            $forClass = (object) ['classAttributes' => array_map(
                fn (\ReflectionAttribute $a) => $a->newInstance(),
                $ref->getAttributes(),
            )];
        }

        foreach ($forClass->classAttributes as $attribute) {
            if ($attribute instanceof Module) {
                $this->moduleAttribute = $attribute;
            }

            if ($attribute instanceof LoadsResources) {
                $this->resourcesAttribute = $attribute;
            }
        }

        // Resolve module identity: attribute → auto-derive from class
        if ($this->moduleAttribute !== null) {
            $this->resolvedModuleName = $this->moduleAttribute->{Module::ATTR_NAME};
            $this->resolvedModuleNamespace = $this->moduleAttribute->{Module::ATTR_NAMESPACE}
                ?? $this->deriveNamespaceFromClass();
        } else {
            $this->resolvedModuleName = $this->deriveModuleNameFromClass();
            $this->resolvedModuleNamespace = $this->deriveNamespaceFromClass();
        }

        // Resolve module path: explicit from attribute or auto-detected
        if ($this->moduleAttribute?->{Module::ATTR_PATH} !== null) {
            $this->resolvedModulePath = $this->moduleAttribute->{Module::ATTR_PATH};
        } else {
            $this->detectModulePath();
        }

        // Validate dependencies (only when #[AsModule] declares them)
        if ($this->moduleAttribute !== null) {
            $this->validateDependencies();
        }
    }

    // =========================================================================
    // Attribute Accessors
    // =========================================================================

    /**
     * Get the resolved #[AsModule] attribute instance.
     *
     * @return Module|null The module attribute, or null if absent.
     */
    protected function getModuleAttribute(): ?Module
    {
        $this->resolveAttributes();

        return $this->moduleAttribute;
    }

    /**
     * Get the resolved #[LoadsResources] configuration.
     *
     * When the attribute is absent, returns a default instance
     * with every flag set to `false` — no conventional resources
     * load until the provider explicitly opts in. See the
     * {@see LoadsResources} class docblock for the rationale.
     *
     * @return LoadsResources The resource configuration.
     */
    protected function getResourcesConfig(): LoadsResources
    {
        $this->resolveAttributes();

        return $this->resourcesAttribute ?? new LoadsResources;
    }

    /**
     * Check if a specific resource should be loaded.
     *
     * @param  string  $resource  The resource flag name (use LoadsResources::ATTR_* constants).
     * @return bool True if the resource should be loaded.
     */
    protected function shouldLoad(string $resource): bool
    {
        return $this->getResourcesConfig()->{$resource};
    }

    // =========================================================================
    // Module Identity Accessors
    // =========================================================================

    /**
     * Get the module name.
     *
     * @return string PascalCase module name (e.g. 'Tenancy', 'Horizon').
     */
    public function getModuleName(): string
    {
        $this->resolveAttributes();

        return $this->resolvedModuleName;
    }

    /**
     * Get the module PSR-4 namespace.
     *
     * @return string The module namespace (e.g. 'Academorix\Tenancy').
     */
    public function getModuleNamespace(): string
    {
        $this->resolveAttributes();

        return $this->resolvedModuleNamespace;
    }

    /**
     * Get the absolute filesystem path to the module root.
     *
     * @return string The module path, or empty string if not resolved.
     */
    public function getModulePath(): string
    {
        $this->resolveAttributes();

        return $this->resolvedModulePath ?? '';
    }

    /**
     * Get the module loading priority.
     *
     * @return int The priority (1-999). Lower loads first. Default: 100.
     */
    public function getPriority(): int
    {
        $this->resolveAttributes();

        return $this->moduleAttribute?->{Module::ATTR_PRIORITY} ?? Module::DEFAULT_PRIORITY;
    }

    /**
     * Get the module slug (lowercase module name).
     *
     * Used for cache keys, asset paths, view namespaces, publish tags.
     *
     * @return string Lowercase module name (e.g. 'tenancy').
     */
    protected function getModuleSlug(): string
    {
        return strtolower($this->getModuleName());
    }

    /**
     * Get the module's source path.
     *
     * Returns {modulePath}/src if it exists (tiered), else {modulePath} (flat).
     *
     * @return string Absolute path to the module's source root.
     */
    protected function getModuleSourcePath(): string
    {
        $modulePath = $this->getModulePath();
        $srcPath = $modulePath.'/src';

        return is_dir($srcPath) ? $srcPath : $modulePath;
    }

    // =========================================================================
    // Auto-Derivation from Class Name
    // =========================================================================

    /**
     * Auto-derive the module name from the service provider class name.
     *
     * Strips the 'ServiceProvider' suffix from the class basename:
     *   HorizonServiceProvider → Horizon
     *   NightwatchServiceProvider → Nightwatch
     *   DebugbarServiceProvider → Debugbar
     *
     * @return string The derived module name (PascalCase).
     */
    private function deriveModuleNameFromClass(): string
    {
        $shortName = (new \ReflectionClass(static::class))->getShortName();

        if (str_ends_with($shortName, 'ServiceProvider')) {
            return substr($shortName, 0, -strlen('ServiceProvider'));
        }

        return $shortName;
    }

    /**
     * Auto-derive the module namespace from the provider's class namespace.
     *
     * Strips the trailing \Providers segment:
     *   Academorix\Tenancy\Providers → Academorix\Tenancy
     *   Academorix\Horizon\Providers → Academorix\Horizon
     *
     * @return string The derived module namespace.
     */
    private function deriveNamespaceFromClass(): string
    {
        $classNamespace = (new \ReflectionClass(static::class))->getNamespaceName();

        if (str_ends_with($classNamespace, '\\Providers')) {
            return substr($classNamespace, 0, -strlen('\\Providers'));
        }

        return $classNamespace;
    }

    // =========================================================================
    // Module Path Auto-Detection
    // =========================================================================

    /**
     * Auto-detect the module path from the provider's file location.
     *
     * Uses ReflectionClass::getFileName() — boot-time only, not per-request.
     *
     * Detection logic:
     *   {module}/src/Providers/XServiceProvider.php → {module}/
     *   {module}/Providers/XServiceProvider.php     → {module}/
     *   Fallback: two directories up from the provider file.
     */
    protected function detectModulePath(): void
    {
        if ($this->resolvedModulePath !== null) {
            return;
        }

        $fileName = (new \ReflectionClass(static::class))->getFileName();

        if ($fileName === false) {
            return;
        }

        $dir = dirname($fileName);

        if (basename($dir) === 'Providers') {
            $parent = dirname($dir);

            $this->resolvedModulePath = basename($parent) === 'src'
                ? (string) realpath(dirname($parent))
                : (string) realpath($parent);
        } else {
            $this->resolvedModulePath = (string) realpath($dir.'/../..');
        }
    }

    // =========================================================================
    // Dependency Validation
    // =========================================================================

    /**
     * Validate that all declared module dependencies are loaded.
     *
     * Only runs when #[AsModule] declares dependencies. Throws if any
     * required module is not registered.
     *
     * Enumerates every discovered `#[AsModule]` target via olvlvl's
     * `Attributes::findTargetClasses(Module::class)` and collects the
     * `name` field from each attribute instance. When the collector
     * isn't primed (fresh clone before `composer dump-autoload`), the
     * check is skipped rather than failing — the alternative would
     * make first-time setup impossible.
     *
     * @throws \RuntimeException If any declared dependency is not loaded.
     */
    private function validateDependencies(): void
    {
        $dependencies = $this->moduleAttribute->{Module::ATTR_DEPENDENCIES};

        if ($dependencies === []) {
            return;
        }

        $registeredModules = [];

        try {
            $targets = Attributes::findTargetClasses(Module::class);

            foreach ($targets as $target) {
                /** @var Module $attr */
                $attr = $target->attribute;
                $registeredModules[] = $attr->name;
            }
        } catch (\LogicException) {
            // Collector not primed — skip cross-module dependency check.
            // Consumers get a warning on first boot until they run
            // `composer dump-autoload`, but the app still boots.
            return;
        }

        $missing = [];

        foreach ($dependencies as $dependency) {
            if (! in_array($dependency, $registeredModules, true)) {
                $missing[] = $dependency;
            }
        }

        if ($missing !== []) {
            throw new \RuntimeException(sprintf(
                'Module "%s" requires the following modules which are not loaded: %s. '
                    .'Ensure these modules are installed and their service providers are registered.',
                $this->resolvedModuleName,
                implode(', ', $missing),
            ));
        }
    }
}
