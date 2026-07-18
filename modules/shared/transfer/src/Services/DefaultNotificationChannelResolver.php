<?php

declare(strict_types=1);

namespace Academorix\Transfer\Services;

use Academorix\Transfer\Contracts\Services\NotificationChannelResolverInterface;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default implementation of {@see NotificationChannelResolverInterface}.
 *
 * Reads the configured default channel list — extend by binding a
 * consumer-specific resolver that reaches into user + tenant
 * settings first.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultNotificationChannelResolver implements NotificationChannelResolverInterface
{
    /**
     * {@inheritDoc}
     */
    public function resolve(string $tenantId, string $userId, ?array $requestOverride = null): array
    {
        // Request override wins outright when provided — the caller
        // explicitly asked for these channels.
        if ($requestOverride !== null && $requestOverride !== []) {
            return \array_values(\array_map('strval', $requestOverride));
        }

        /** @var list<string> $defaults */
        $defaults = (array) \config('transfer.notifications.default_channels', ['database', 'broadcast']);

        return \array_values(\array_map('strval', $defaults));
    }
}
