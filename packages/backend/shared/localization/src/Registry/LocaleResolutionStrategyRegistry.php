<?php

declare(strict_types=1);

namespace Stackra\Localization\Registry;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Stackra\Localization\Contracts\Registry\LocaleResolutionStrategyRegistryInterface;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

/**
 * In-memory registry of every locale-resolution strategy discovered
 * via {@see AsLocaleResolutionStrategy}.
 *
 * Hydrated at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom]` declaration on
 * {@see LocaleResolutionStrategyRegistryInterface::register()}.
 *
 * `#[Singleton]` — the registry is a pure function of the composer
 * manifest, same output every boot; safely shared across every
 * request under Octane. Strategy INSTANCES themselves are resolved
 * per-call so their own DI (per-request request objects, ...) stays
 * clean.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Singleton]
final class LocaleResolutionStrategyRegistry implements LocaleResolutionStrategyRegistryInterface
{
    /**
     * Strategy catalogue keyed by name.
     *
     * @var array<string, class-string<LocaleResolutionStrategyInterface>>
     */
    private array $strategies = [];

    /**
     * @param  Container  $container  Resolves discovered strategy
     *                                classes on {@see resolve()} so
     *                                their own DI dependencies land
     *                                cleanly.
     */
    public function __construct(private readonly Container $container)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsLocaleResolutionStrategy $attribute): void
    {
        /** @var class-string<LocaleResolutionStrategyInterface> $className */
        $this->strategies[$attribute->name] = $className;
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $name): LocaleResolutionStrategyInterface
    {
        if (! isset($this->strategies[$name])) {
            throw new InvalidArgumentException(\sprintf(
                'Unknown locale-resolution strategy "%s".',
                $name,
            ));
        }

        /** @var LocaleResolutionStrategyInterface $instance */
        $instance = $this->container->make($this->strategies[$name]);

        return $instance;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $name): bool
    {
        return isset($this->strategies[$name]);
    }

    /**
     * {@inheritDoc}
     */
    public function names(): array
    {
        return \array_keys($this->strategies);
    }
}
