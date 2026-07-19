<?php

declare(strict_types=1);

namespace Academorix\Activity\Services;

use Academorix\Activity\Attributes\LoggableActivity;
use Academorix\Activity\Contracts\Services\ActivityRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of every model class carrying the
 * {@see LoggableActivity} attribute.
 *
 * Hydrated at boot by the framework's generic hydration pump
 * ({@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper})
 * via the `#[HydratesFrom]` declaration on
 * {@see ActivityRegistryInterface::register()}.
 *
 * Idempotent — registering the same class twice is a no-op.
 *
 * `#[Singleton]` because the registry is a pure function of the
 * composer manifest — same output every boot, safely shared across
 * every request under Octane.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Singleton]
final class ActivityRegistry implements ActivityRegistryInterface
{
    /**
     * Registered model classes, keyed by FQCN for O(1) `has()` checks.
     * Value is `true` (a set, not a map).
     *
     * @var array<class-string, true>
     */
    private array $classes = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, LoggableActivity $attribute): void
    {
        // Idempotent — repeat registration is a no-op. The attribute
        // carries no configuration today; the parameter exists for
        // uniformity with the hydration contract. Future fields on
        // LoggableActivity (log-name override, retention hint) would
        // read from $attribute here.
        unset($attribute); // suppress unused-param warning until fields land

        $this->classes[$className] = true;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return \array_keys($this->classes);
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $className): bool
    {
        return isset($this->classes[$className]);
    }

    /**
     * {@inheritDoc}
     */
    public function clear(): void
    {
        $this->classes = [];
    }
}
