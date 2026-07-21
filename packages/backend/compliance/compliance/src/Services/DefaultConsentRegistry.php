<?php

declare(strict_types=1);

namespace Stackra\Compliance\Services;

use Stackra\Compliance\Attributes\ConsentRequired;
use Stackra\Compliance\Contracts\Services\ConsentRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every `#[ConsentRequired]`-declared gate.
 *
 * Hydrated at boot by the framework's generic hydration pump.
 * `#[Singleton]` — pure function of the composer manifest.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultConsentRegistry implements ConsentRegistryInterface
{
    /**
     * Category key → list of registered class-strings.
     *
     * @var array<string, list<class-string>>
     */
    private array $byCategory = [];

    /**
     * Class-string set for `has()` lookups.
     *
     * @var array<class-string, true>
     */
    private array $classes = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, ConsentRequired $attribute): void
    {
        // Idempotent — the last registration wins for the same class.
        $this->classes[$className] = true;

        $category = $attribute->category;
        if (! isset($this->byCategory[$category])) {
            $this->byCategory[$category] = [];
        }

        if (! \in_array($className, $this->byCategory[$category], strict: true)) {
            $this->byCategory[$category][] = $className;
        }
    }

    /**
     * {@inheritDoc}
     */
    public function categories(): array
    {
        return \array_keys($this->byCategory);
    }

    /**
     * {@inheritDoc}
     */
    public function gatesFor(string $category): array
    {
        return $this->byCategory[$category] ?? [];
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $className): bool
    {
        return isset($this->classes[$className]);
    }
}
