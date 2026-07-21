<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Services\LocaleResolutionStrategyRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every class carrying
 * {@see AsLocaleResolutionStrategy}. Hydrated at boot by the
 * framework's generic
 * {@see \Stackra\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * via the `#[HydratesFrom]` attribute on {@see register()}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(LocaleResolutionStrategyRegistry::class)]
interface LocaleResolutionStrategyRegistryInterface
{
    /**
     * Register a strategy class. Idempotent — the second
     * registration of the same name overwrites the first.
     *
     * The `#[HydratesFrom]` marker tells the framework's hydration
     * pump to feed this method with every class carrying
     * {@see AsLocaleResolutionStrategy}.
     *
     * @param  class-string  $className  FQCN of the strategy.
     * @param  AsLocaleResolutionStrategy  $attribute  Discovered attribute instance.
     */
    #[HydratesFrom(AsLocaleResolutionStrategy::class)]
    public function register(string $className, AsLocaleResolutionStrategy $attribute): void;

    /**
     * Resolve a strategy by its registered name.
     *
     * @param  string  $name  Strategy identifier from the config chain.
     * @return LocaleResolutionStrategyInterface  The resolved strategy.
     */
    public function resolve(string $name): LocaleResolutionStrategyInterface;

    /**
     * Whether a strategy by that name is registered.
     */
    public function has(string $name): bool;

    /**
     * Every registered strategy name.
     *
     * @return list<string>
     */
    public function names(): array;
}
