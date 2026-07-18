<?php

declare(strict_types=1);

namespace Academorix\Localization\Services;

use Academorix\Localization\Attributes\AsTranslatorDriver;
use Academorix\Localization\Contracts\Services\TranslatorDriverInterface;
use Academorix\Localization\Contracts\Services\TranslatorDriverRegistryInterface;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

/**
 * In-memory registry of every translator driver discovered via
 * {@see AsTranslatorDriver}.
 *
 * Hydrated at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom]` declaration on
 * {@see TranslatorDriverRegistryInterface::register()}.
 *
 * `#[Singleton]` — same rationale as the strategy registry.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Singleton]
final class TranslatorDriverRegistry implements TranslatorDriverRegistryInterface
{
    /**
     * Driver catalogue keyed by name.
     *
     * @var array<string, class-string<TranslatorDriverInterface>>
     */
    private array $drivers = [];

    /**
     * @param  Container  $container  Resolves driver classes on
     *                                {@see resolve()}.
     */
    public function __construct(private readonly Container $container)
    {
    }

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsTranslatorDriver $attribute): void
    {
        /** @var class-string<TranslatorDriverInterface> $className */
        $this->drivers[$attribute->name] = $className;
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(string $name): TranslatorDriverInterface
    {
        if (! isset($this->drivers[$name])) {
            throw new InvalidArgumentException(\sprintf(
                'Unknown translator driver "%s".',
                $name,
            ));
        }

        /** @var TranslatorDriverInterface $instance */
        $instance = $this->container->make($this->drivers[$name]);

        return $instance;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $name): bool
    {
        return isset($this->drivers[$name]);
    }

    /**
     * {@inheritDoc}
     */
    public function names(): array
    {
        return \array_keys($this->drivers);
    }
}
