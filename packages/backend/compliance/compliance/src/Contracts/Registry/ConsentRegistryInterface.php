<?php

declare(strict_types=1);

namespace Stackra\Compliance\Contracts\Registry;

use Stackra\Compliance\Attributes\ConsentRequired;
use Stackra\Compliance\Registry\DefaultConsentRegistry;
use Stackra\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * In-memory registry of every `#[ConsentRequired]`-declared gate.
 *
 * Hydrated at boot by the framework's generic hydration pump via
 * the `#[HydratesFrom(ConsentRequired::class)]` declaration on
 * {@see register()}. Consumers query the registry to enumerate
 * every action / job that requires a given consent category.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Bind(DefaultConsentRegistry::class)]
interface ConsentRegistryInterface
{
    /**
     * Register a `#[ConsentRequired]` target.
     *
     * @param  class-string       $className  FQCN of the target class.
     * @param  ConsentRequired    $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(ConsentRequired::class)]
    public function register(string $className, ConsentRequired $attribute): void;

    /**
     * Every category key referenced by at least one gate.
     *
     * @return list<string>
     */
    public function categories(): array;

    /**
     * Every registered gate for a given category.
     *
     * @return list<class-string>
     */
    public function gatesFor(string $category): array;

    /**
     * Whether a specific target is registered.
     *
     * @param  class-string  $className  FQCN to check.
     */
    public function has(string $className): bool;
}
