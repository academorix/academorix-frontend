<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Services;

use Academorix\Notifications\Sms\Contracts\Services\SmsOptOutRegistryInterface;
use Academorix\Notifications\Sms\Contracts\Services\SmsTransportInterface;
use Academorix\Notifications\Sms\Contracts\Services\SmsTransportManagerInterface;
use Academorix\Notifications\Sms\Exceptions\SmsProviderDisabledException;
use Illuminate\Container\Attributes\Singleton;
use Illuminate\Contracts\Container\Container;

/**
 * Default implementation of {@see SmsTransportManagerInterface}.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Singleton]
final class SmsTransportManager implements SmsTransportManagerInterface
{
    /**
     * Resolved driver instances keyed by driver name.
     *
     * @var array<string, SmsTransportInterface>
     */
    private array $drivers = [];

    public function __construct(
        private readonly Container $container,
        private readonly SmsOptOutRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function driver(string $name): SmsTransportInterface
    {
        if (isset($this->drivers[$name])) {
            return $this->drivers[$name];
        }

        if (! $this->registry->has($name)) {
            throw new SmsProviderDisabledException(
                \sprintf('No SMS provider driver registered under key "%s".', $name),
            );
        }

        $definition = $this->registry->all()[$name];

        /** @var SmsTransportInterface $instance */
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
    public function extend(string $name, SmsTransportInterface $driver): void
    {
        $this->drivers[$name] = $driver;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        foreach ($this->registry->names() as $name) {
            if (! isset($this->drivers[$name])) {
                $this->driver($name);
            }
        }

        return $this->drivers;
    }
}
