<?php

declare(strict_types=1);

namespace Stackra\Notifications\Contracts\Services;

use Stackra\Notifications\Services\NotificationChannelRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Registry of channel modules that have registered themselves with
 * the notifications substrate.
 *
 * Channel modules (`notifications-mail`, `notifications-sms`,
 * `notifications-push`, `notifications-in-app`) register their concrete
 * transport class + declared feature set (batching, tracking, replay)
 * against a channel key (`mail`, `sms`, `push`, `in_app`).
 *
 * The dispatch gateway consults this registry to decide which channels
 * are actually implemented before firing a `NotificationDispatched`
 * event with the resolved channel list.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[Bind(NotificationChannelRegistry::class)]
interface NotificationChannelRegistryInterface
{
    /**
     * Register a channel module.
     *
     * @param  string                $channel        Channel key (e.g. `mail`).
     * @param  string                $providerClass  FQCN of the channel-module provider.
     * @param  array<string, mixed>  $features       Feature map (batching, tracking, replay).
     */
    public function register(string $channel, string $providerClass, array $features = []): void;

    /**
     * Whether `$channel` has a registered provider.
     */
    public function has(string $channel): bool;

    /**
     * Every registered channel keyed by channel key.
     *
     * @return array<string, array{provider: string, features: array<string, mixed>}>
     */
    public function all(): array;

    /**
     * The set of registered channel keys.
     *
     * @return list<string>
     */
    public function channels(): array;
}
