<?php

declare(strict_types=1);

namespace Stackra\Search\Services;

use Stackra\Search\Attributes\Searchable;
use Stackra\Search\Contracts\Services\EngineRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[Searchable]`-marked model class.
 *
 * Hydrated at boot by the framework's generic hydration pump via the
 * `#[HydratesFrom]` declaration on {@see EngineRegistryInterface::register()}.
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Singleton]
final class EngineRegistry implements EngineRegistryInterface
{
    /**
     * Registered attribute instances, keyed by class FQCN for O(1)
     * `has()` / `attributeFor()` lookups.
     *
     * @var array<class-string, Searchable>
     */
    private array $entries = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, Searchable $attribute): void
    {
        // Idempotent — repeat registration overwrites with the latest
        // attribute (last-wins) so a discovery re-run stays safe.
        $this->entries[$className] = $attribute;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return \array_keys($this->entries);
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $className): bool
    {
        return isset($this->entries[$className]);
    }

    /**
     * {@inheritDoc}
     */
    public function attributeFor(string $className): ?Searchable
    {
        return $this->entries[$className] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function clear(): void
    {
        $this->entries = [];
    }
}
