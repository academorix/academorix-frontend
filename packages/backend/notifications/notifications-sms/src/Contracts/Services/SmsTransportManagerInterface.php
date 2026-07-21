<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Contracts\Services;

use Stackra\Notifications\Sms\Services\SmsTransportManager;
use Illuminate\Container\Attributes\Bind;

/**
 * MultipleInstanceManager wrapping the configured SMS provider drivers.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Bind(SmsTransportManager::class)]
interface SmsTransportManagerInterface
{
    /**
     * Resolve a driver by name.
     *
     * @throws \Stackra\Notifications\Sms\Exceptions\SmsProviderDisabledException
     */
    public function driver(string $name): SmsTransportInterface;

    /**
     * Whether the manager knows about a driver name.
     */
    public function has(string $name): bool;

    /**
     * Register a driver at runtime.
     */
    public function extend(string $name, SmsTransportInterface $driver): void;

    /**
     * Every registered driver keyed by name.
     *
     * @return array<string, SmsTransportInterface>
     */
    public function all(): array;
}
