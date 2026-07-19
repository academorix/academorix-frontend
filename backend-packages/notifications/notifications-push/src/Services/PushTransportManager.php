<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Services;

use Academorix\Notifications\Push\Contracts\Services\PushSubscriptionRegistryInterface;
use Academorix\Notifications\Push\Contracts\Services\PushTransportInterface;
use Academorix\Notifications\Push\Contracts\Services\PushTransportManagerInterface;
use Academorix\Notifications\Push\Exceptions\PushProviderDisabledException;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;

/**
 * Default implementation of {@see PushTransportManagerInterface}.
 *
 * `#[Singleton]` — stateless across requests; each driver instance is resolved
 * lazily via the container and cached in the `$drivers` map.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Singleton]
final class PushTransportManager implements PushTransportManagerInterface
{
    /**
     * Resolved driver instances keyed by driver name.
     *
     * @var array<string, PushTransportInterface>
     */
    private array $drivers = [];

    public function __construct(
        private readonly Container $container,
        private readonly PushSubscriptionRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function driver(string $name): PushTransportInterface
    {
        if (isset($this->drivers[$name])) {
            return $this->drivers[$name];
        }

        if (! $this->registry->has($name)) {
            throw new PushProviderDisabledException(
                \sprintf('No push provider driver registered under key "%s".', $name),
            );
        }

        $definition = $this->registry->all()[$name];

        /** @var PushTransportInterface $instance */
        $instance = $this->container->make($definition['class']);

        return $this->drivers[$name] = $instance;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $name): bool
    {
        return $this->registry->has($name) || isset($this->drivers[$name]);
    }

    /**
     * {@inheritDoc}
     */
    public function extend(string $name, PushTransportInterface $driver): void
    {
        $this->drivers[$name] = $driver;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        // Resolve every registered driver so callers get a complete map.
        foreach ($this->registry->names() as $name) {
            if (! isset($this->drivers[$name])) {
                $this->driver($name);
            }
        }

        return $this->drivers;
    }
}
