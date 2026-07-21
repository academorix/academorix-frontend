<?php

declare(strict_types=1);

/**
 * Sentry Context Registry Service
 *
 * Core service providing Sentry Context Registry operations for the Telemetry module.
 * Encapsulates business logic and coordinates with repositories and external systems.
 *
 * @category Services
 *
 * @since    1.0.0
 */
namespace Stackra\Sentry\Services;

use Illuminate\Container\Attributes\Tag;
use Illuminate\Support\Collection;
use Stackra\Contracts\Telemetry\Sentry\SentryContext as SentryContextContracts;
use Stackra\Contracts\Telemetry\Sentry\SentryContextRegistry as SentryContextRegistryContracts;
use Stackra\Foundation\Enums\ContainerToken;
use Sentry\State\Scope;
use Throwable;

/**
 * Sentry Context Registry.
 *
 * Manages and executes all registered Sentry context providers.
 * Context providers are automatically discovered via Laravel's service container
 * tagging system and executed in priority order.
 *
 * ## Architecture:
 * - Uses Laravel's #[Tag] attribute for auto-discovery
 * - Supports priority-based execution order
 * - Allows manual registration for flexibility
 * - Thread-safe and singleton
 *
 * ## Usage:
 *
 * ### Auto-Discovery (Recommended):
 * ```php
 * // In your service provider
 * public function register(): void
 * {
 *     $this->app->tag(
 *         MyContextProvider::class,
 *         'sentry.context.provider'
 *     );
 * }
 * ```
 *
 * ### Runtime Registration (Request-Scoped):
 * ```php
 * $registry = app(SentryContextRegistry::class);
 * $registry->register(new MyContextProvider());
 * ```
 *
 * ### Apply All Context:
 * ```php
 * $registry = app(SentryContextRegistry::class);
 * $registry->applyAll($scope, $exception);
 * ```
 */

/**
 * Sentry Context Registry.
 *
 * Manages and executes all registered Sentry context providers.
 *
 * ## Octane Safety:
 * This class is marked as #[Scoped], meaning it is recreated for every request.
 * This prevents "stale dependency" issues where providers resolved from the
 * container might hold data from a previous request.
 */
class SentryContextRegistry implements SentryContextRegistryContracts
{
    /**
     * Manually registered context providers.
     *
     * These are stored in the instance and are request-scoped because
     * the registry itself is marked as #[Scoped].
     *
     * @var Collection<int, SentryContextRegistryContracts>
     */
    protected Collection $manualProviders;

    /**
     * Create a new registry instance.
     *
     * @param iterable<SentryContextRegistryContracts> $taggedProviders Tagged context providers
     */
    public function __construct(
        /**
         * Tagged context providers from container.
         */
        #[Tag(SentryContextRegistryContracts::CONTEXT_TAG_TOKEN)]
        protected iterable $taggedProviders
    ) {
        $this->manualProviders = collect();
    }

    /**
     * Register a context provider for the current request.
     *
     * Use this for dynamic registration during the request cycle.
     * Since this class is #[Scoped], these providers will not
     * leak into other requests in an Octane environment.
     *
     * @param SentryContextContracts $sentryContextContracts Context provider
     */
    public function register(SentryContextContracts $sentryContextContracts): void
    {
        $this->manualProviders->push($sentryContextContracts);
    }

    /**
     * Clear all manually registered providers for the current request.
     *
     * Useful for testing.
     */
    public function clearManual(): void
    {
        $this->manualProviders = collect();
    }

    /**
     * Get all registered context providers (tagged + manual).
     *
     * Providers are sorted by priority (highest first).
     *
     * @return Collection<int, SentryContextRegistryContracts>
     */
    public function getProviders(): Collection
    {
        // Merge tagged and manual providers
        /** @var Collection<int, SentryContextRegistryContracts> $providers */
        $providers = collect($this->taggedProviders)
            ->merge($this->manualProviders)
            ->sortByDesc(fn (SentryContextContracts $sentryContextContracts): int => $sentryContextContracts->priority())
            ->values();

        return $providers;
    }

    /**
     * Apply all context providers to the Sentry scope.
     *
     * Executes all registered context providers in priority order.
     * Catches and logs any exceptions to prevent context providers
     * from breaking error reporting.
     *
     * @param Scope          $scope     Sentry scope
     * @param Throwable|null $throwable Exception being reported
     */
    public function applyAll(Scope $scope, ?Throwable $throwable = null): void
    {
        foreach ($this->getProviders() as $provider) {
            try {
                $provider->provide($scope, $throwable);
            } catch (Throwable $e) {
                // Log but don't throw - context providers should never break error reporting
                if (app()->bound(ContainerToken::LOG())) {
                    logger()->warning('Sentry context provider failed', [
                        'provider' => $provider::class,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }
}
