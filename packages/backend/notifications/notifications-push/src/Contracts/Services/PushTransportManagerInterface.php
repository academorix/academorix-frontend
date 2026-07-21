<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Contracts\Services;

use Stackra\Notifications\Push\Services\PushTransportManager;
use Illuminate\Container\Attributes\Bind;

/**
 * MultipleInstanceManager wrapping the configured push provider drivers.
 *
 * Consumers call `manager->instance('fcm')->send(...)` OR let the manager pick
 * the driver based on a subscription's `provider` column. Drivers are
 * registered at boot via the {@see \Stackra\Notifications\Push\Attributes\AsPushProvider}
 * attribute discovery pipeline.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Bind(PushTransportManager::class)]
interface PushTransportManagerInterface
{
    /**
     * Resolve a driver by name.
     *
     * @throws \Stackra\Notifications\Push\Exceptions\PushProviderDisabledException
     *   When the provider is unknown or feature-flagged off.
     */
    public function driver(string $name): PushTransportInterface;

    /**
     * Whether the manager knows about a driver name.
     */
    public function has(string $name): bool;

    /**
     * Register a driver at runtime. Consumers that want to swap in a fake for
     * a specific provider use this seam.
     */
    public function extend(string $name, PushTransportInterface $driver): void;

    /**
     * Every registered driver keyed by name.
     *
     * @return array<string, PushTransportInterface>
     */
    public function all(): array;
}
