<?php

declare(strict_types=1);

namespace Stackra\Search\Contracts\Registry;

use Stackra\Search\Attributes\Searchable;
use Stackra\Search\Registry\EngineRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every `#[Searchable]`-marked model class + its bound
 * engine adapter.
 *
 * Hydrated at boot by the framework's generic hydration pump via the
 * `#[HydratesFrom]` declaration on {@see register()}. Consumers depend
 * on this interface (never the concrete class) so tests can bind a
 * fake.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(EngineRegistry::class)]
interface EngineRegistryInterface
{
    /**
     * Register a model class as searchable. Idempotent.
     *
     * `#[HydratesFrom(Searchable::class)]` — the framework scans every
     * class carrying `#[Searchable]` at boot and calls this with
     * `(className, attributeInstance)`.
     *
     * @param  class-string  $className  FQCN of the model.
     * @param  Searchable    $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(Searchable::class)]
    public function register(string $className, Searchable $attribute): void;

    /**
     * Every registered model class.
     *
     * @return list<class-string>
     */
    public function all(): array;

    /**
     * Whether the given class is registered.
     *
     * @param  class-string  $className
     */
    public function has(string $className): bool;

    /**
     * Look up the attribute instance for a registered class.
     *
     * @param  class-string  $className
     */
    public function attributeFor(string $className): ?Searchable;

    /**
     * Reset the registry — used by tests between fixtures.
     */
    public function clear(): void;
}
