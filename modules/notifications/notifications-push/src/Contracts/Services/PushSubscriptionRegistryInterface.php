<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Contracts\Services;

use Academorix\Notifications\Push\Attributes\AsPushProvider;
use Academorix\Notifications\Push\Services\PushSubscriptionRegistry;
use Academorix\ServiceProvider\Attributes\HydratesFrom;
use Illuminate\Container\Attributes\Bind;

/**
 * Attribute-discovered registry of {@see AsPushProvider} driver classes.
 *
 * Hydrated at boot by the framework's generic
 * {@see \Academorix\ServiceProvider\Bootstrappers\HydrationBootstrapper}
 * pump via the {@see HydratesFrom} attribute on {@see register()}. The
 * {@see \Academorix\Notifications\Push\Contracts\Services\PushTransportManagerInterface}
 * consults this registry to know which drivers exist before resolving one.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Bind(PushSubscriptionRegistry::class)]
interface PushSubscriptionRegistryInterface
{
    /**
     * Register a discovered push provider class.
     *
     * `#[HydratesFrom(AsPushProvider::class)]` — the framework scans every
     * class carrying `#[AsPushProvider]` at boot and calls this method with
     * `(className, attributeInstance)`. The registry stores the row keyed by
     * driver name.
     *
     * @param  class-string    $className  FQCN of the driver class.
     * @param  AsPushProvider  $attribute  The discovered attribute instance.
     */
    #[HydratesFrom(AsPushProvider::class)]
    public function register(string $className, AsPushProvider $attribute): void;

    /**
     * Whether a driver name is registered.
     */
    public function has(string $name): bool;

    /**
     * Every registered driver keyed by name.
     *
     * @return array<string, array{class: class-string, platforms: list<string>, supports_batching: bool}>
     */
    public function all(): array;

    /**
     * Every registered driver name.
     *
     * @return list<string>
     */
    public function names(): array;
}
