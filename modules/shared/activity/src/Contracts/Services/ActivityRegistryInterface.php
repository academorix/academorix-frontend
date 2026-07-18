<?php

declare(strict_types=1);

namespace Academorix\Activity\Contracts\Services;

use Academorix\Activity\Attributes\LoggableActivity;
use Academorix\Activity\Services\ActivityRegistry;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of every model class carrying the {@see LoggableActivity}
 * attribute — the compile-time inventory of the activity feed.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}.
 * Consumers depend on this interface (never the concrete class) so
 * tests can bind a fake.
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Bind(ActivityRegistry::class)]
interface ActivityRegistryInterface
{
    /**
     * Register a model class as loggable. Idempotent — the second
     * registration of the same class is a no-op.
     *
     * `#[HydratesFrom(LoggableActivity::class)]` — the framework
     * scans every class carrying `#[LoggableActivity]` at boot and
     * calls this method with `(className, attributeInstance)`. The
     * attribute carries no configuration; the parameter is present
     * for uniformity with the hydration contract.
     *
     * @param  class-string  $className  FQCN of the model.
     * @param  LoggableActivity  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(LoggableActivity::class)]
    public function register(string $className, LoggableActivity $attribute): void;

    /**
     * Every registered model class, in registration order.
     *
     * @return list<class-string>
     */
    public function all(): array;

    /**
     * Whether a given class is registered.
     *
     * @param  class-string  $className  FQCN to check.
     */
    public function has(string $className): bool;

    /**
     * Reset the registry — used by tests between fixtures.
     */
    public function clear(): void;
}
