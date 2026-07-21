<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Registry;

use Stackra\FeatureFlags\Exceptions\DuplicateFeatureFlagException;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every discovered feature flag definition.
 *
 * One process-wide instance — `#[Singleton]` under the container.
 * Populated by `FeatureFlagDiscovery` at boot; read by resolver
 * layers (via `ResolutionContext::$definition`), admin actions,
 * console commands, and the boot-payload contributor. Immutable
 * from the outside: no `unregister()`, no `clear()` — reboots are
 * the only way to purge.
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
#[Bind(FeatureFlagRegistry::class)]
#[Singleton]
final class FeatureFlagRegistry
{
    /**
     * Definitions keyed by their public flag name.
     *
     * @var array<string, FeatureDefinition>
     */
    private array $definitions = [];

    /**
     * Register a discovered definition. Idempotent for identical registrations.
     *
     * @param  FeatureDefinition  $definition  Registry entry hydrated from a `#[AsFeatureFlag]` attribute.
     * @return void
     *
     * @throws DuplicateFeatureFlagException  When two distinct classes declare the same flag name.
     */
    public function register(FeatureDefinition $definition): void
    {
        $existing = $this->definitions[$definition->name] ?? null;
        if ($existing !== null && $existing->className !== $definition->className) {
            throw DuplicateFeatureFlagException::between(
                $definition->name,
                $existing->className,
                $definition->className,
            );
        }

        $this->definitions[$definition->name] = $definition;
    }

    /**
     * Fetch a registered definition by flag name.
     *
     * @param  string  $name  Stable dot-separated flag identifier.
     * @return FeatureDefinition|null  The registered definition, or null when unknown.
     */
    public function get(string $name): ?FeatureDefinition
    {
        return $this->definitions[$name] ?? null;
    }

    /**
     * Return every registered definition keyed by flag name.
     *
     * @return array<string, FeatureDefinition>
     */
    public function all(): array
    {
        return $this->definitions;
    }

    /**
     * Return the set of registered flag names.
     *
     * @return list<string>
     */
    public function names(): array
    {
        return array_keys($this->definitions);
    }

    /**
     * Presence check — return true when `$name` is registered.
     *
     * @param  string  $name  Flag identifier to test.
     * @return bool
     */
    public function has(string $name): bool
    {
        return array_key_exists($name, $this->definitions);
    }
}
