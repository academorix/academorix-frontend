<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Registry;

use Stackra\Notifications\Sms\Attributes\AsSmsProvider;
use Stackra\Notifications\Sms\Contracts\Registry\SmsOptOutRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default in-memory implementation of {@see SmsOptOutRegistryInterface}.
 *
 * `#[Singleton]` — populated at boot via `#[HydratesFrom]` and read on every
 * dispatch. Stateless across requests.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Singleton]
final class SmsOptOutRegistry implements SmsOptOutRegistryInterface
{
    /**
     * Registered drivers keyed by name.
     *
     * @var array<string, array{class: class-string, supports_inbound: bool, supports_cost: bool}>
     */
    private array $drivers = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsSmsProvider $attribute): void
    {
        if (! $attribute->enabled) {
            return;
        }

        $this->drivers[$attribute->name] = [
            'class'            => $className,
            'supports_inbound' => $attribute->supportsInbound,
            'supports_cost'    => $attribute->supportsCost,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $name): bool
    {
        return isset($this->drivers[$name]);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->drivers;
    }

    /**
     * {@inheritDoc}
     */
    public function names(): array
    {
        return \array_keys($this->drivers);
    }
}
