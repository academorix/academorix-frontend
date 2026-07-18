<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Services;

use Academorix\Notifications\Push\Attributes\AsPushProvider;
use Academorix\Notifications\Push\Contracts\Services\PushSubscriptionRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default in-memory implementation of
 * {@see PushSubscriptionRegistryInterface}.
 *
 * `#[Singleton]` — the registry is populated once at boot via
 * `#[HydratesFrom]` and read on every dispatch. Stateless across requests;
 * safe to share.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Singleton]
final class PushSubscriptionRegistry implements PushSubscriptionRegistryInterface
{
    /**
     * Registered drivers keyed by name.
     *
     * @var array<string, array{class: class-string, platforms: list<string>, supports_batching: bool}>
     */
    private array $drivers = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $className, AsPushProvider $attribute): void
    {
        // Feature-flag: keep the class in the codebase but skip registration.
        if (! $attribute->enabled) {
            return;
        }

        $this->drivers[$attribute->name] = [
            'class'             => $className,
            'platforms'         => $attribute->platforms,
            'supports_batching' => $attribute->supportsBatching,
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
