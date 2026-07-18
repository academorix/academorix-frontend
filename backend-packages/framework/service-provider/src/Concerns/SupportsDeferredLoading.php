<?php

declare(strict_types=1);

/**
 * SupportsDeferredLoading Trait.
 *
 * Provides deferred loading support for module service providers. When
 * deferred, Laravel only loads the provider when one of its declared
 * services is requested from the container, improving application boot time.
 *
 * Deferred loading is configured via `#[AsModule(deferred: true)]` on the
 * service provider class. The trait reads this attribute and auto-detects
 * provided services from the HasBindings interface.
 *
 * ## When to Defer:
 *   - Provider ONLY registers bindings (no routes, views, middleware, commands)
 *   - Provider has `#[LoadsResources]` with everything disabled
 *   - Provider implements HasBindings but no boot-phase hooks
 *
 * ## When NOT to Defer:
 *   - Provider loads routes, views, translations, or middleware
 *   - Provider registers event listeners or observers
 *   - Provider runs boot-time logic (Blueprint macros, Pennant scopes, etc.)
 *
 * @category Concerns
 *
 * @since    1.0.0
 */

namespace Academorix\ServiceProvider\Concerns;

use Academorix\ServiceProvider\Attributes\AsModule;
use olvlvl\ComposerAttributeCollector\Attributes;

/**
 * Enables deferred loading for service providers.
 *
 * Usage:
 *   #[AsModule(name: 'Heavy', deferred: true)]
 *   class HeavyServiceProvider extends ServiceProvider implements HasBindings
 *   {
 *       public function bindings(): void
 *       {
 *           $this->app->singleton(HeavyServiceInterface::class, HeavyService::class);
 *       }
 *   }
 *   // Provider only loads when HeavyServiceInterface is resolved
 */
trait SupportsDeferredLoading
{
    /**
     * Whether loading of this provider is deferred.
     *
     * Auto-detected from `#[AsModule(deferred: true)]` attribute.
     * Can be overridden by setting this property directly.
     *
     * Note: Deferred providers should NOT load routes, views, or middleware
     * since those require boot-time registration.
     */
    protected bool $defer = false;

    /**
     * Whether the deferred flag has been resolved from the attribute.
     */
    private bool $deferResolved = false;

    /**
     * Get the services provided by the provider (for deferred loading).
     *
     * When deferred, Laravel uses this list to determine when to load
     * the provider. Auto-detects services from HasBindings if not
     * explicitly overridden.
     *
     * @return array<int, string> Array of service class/interface names.
     */
    public function provides(): array
    {
        if (! $this->isDeferred()) {
            return [];
        }

        return $this->getProvidedServices();
    }

    /**
     * Check if this provider is deferred.
     *
     * Reads from `#[AsModule(deferred: true)]` on first call, then caches.
     *
     * @return bool True if the provider should be deferred.
     */
    public function isDeferred(): bool
    {
        if (! $this->deferResolved) {
            $this->resolveDeferredFromAttribute();
            $this->deferResolved = true;
        }

        return $this->defer;
    }

    /**
     * Resolve the deferred flag from the #[AsModule] attribute.
     *
     * Uses olvlvl's composer-attribute-collector for cached attribute
     * lookup. Falls back to runtime reflection when the collector's
     * generated file has not yet been produced (fresh clone before
     * `composer dump-autoload`).
     */
    private function resolveDeferredFromAttribute(): void
    {
        try {
            $forClass = Attributes::forClass(static::class);
            $attributes = $forClass->classAttributes;
        } catch (\LogicException) {
            // Collector not primed — fall back to runtime reflection so
            // deferred loading still works on the very first boot after
            // a clone.
            $ref = new \ReflectionClass(static::class);
            $attributes = array_map(
                fn (\ReflectionAttribute $a) => $a->newInstance(),
                $ref->getAttributes(),
            );
        }

        foreach ($attributes as $attr) {
            if ($attr instanceof Module && $attr->deferred) {
                $this->defer = true;

                return;
            }
        }
    }

    /**
     * Get the list of services this module provides.
     *
     * Override this method in child classes to declare which services
     * trigger loading of this deferred provider.
     *
     * @return array<int, string> Array of service class/interface names.
     */
    protected function getProvidedServices(): array
    {
        return [];
    }
}
