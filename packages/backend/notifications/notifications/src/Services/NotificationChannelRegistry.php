<?php

declare(strict_types=1);

namespace Stackra\Notifications\Services;

use Stackra\Notifications\Contracts\Services\NotificationChannelRegistryInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * In-memory registry of channel modules that have registered
 * themselves with the notifications substrate.
 *
 * Channel modules (`notifications-mail`, `notifications-sms`,
 * `notifications-push`, `notifications-in-app`) declare their
 * transport class via `#[AsNotificationChannel]` — the dispatch
 * gateway consults this registry to filter the resolved channel
 * list to the ones with a live provider.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Singleton]
final class NotificationChannelRegistry implements NotificationChannelRegistryInterface
{
    /**
     * Registered channels keyed by channel key.
     *
     * @var array<string, array{provider: string, features: array<string, mixed>}>
     */
    private array $channels = [];

    /**
     * {@inheritDoc}
     */
    public function register(string $channel, string $providerClass, array $features = []): void
    {
        $this->channels[$channel] = [
            'provider' => $providerClass,
            'features' => $features,
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $channel): bool
    {
        return isset($this->channels[$channel]);
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->channels;
    }

    /**
     * {@inheritDoc}
     */
    public function channels(): array
    {
        return \array_keys($this->channels);
    }
}
