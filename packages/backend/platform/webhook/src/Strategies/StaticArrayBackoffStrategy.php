<?php

declare(strict_types=1);

namespace Stackra\Webhook\Strategies;

use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * Fixed-schedule backoff.
 *
 * Reads a `[10, 60, 300, 900, 3600]`-shaped list of seconds from the
 * subscription's `backoff_config.seconds` (falling back to the app
 * config default `webhook.backoff.static.seconds`). Retry N picks the
 * (N-1)th slot; overshooting the array clamps to the last slot.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class StaticArrayBackoffStrategy
{
    /**
     * Compute the delay (seconds) until the next retry.
     */
    public function resolve(WebhookSubscription $subscription, int $attempt): int
    {
        $config = $subscription->{WebhookSubscriptionInterface::ATTR_BACKOFF_CONFIG};

        /** @var list<int> $seconds */
        $seconds = \is_array($config) && isset($config['seconds']) && \is_array($config['seconds'])
            ? \array_values(\array_map('intval', $config['seconds']))
            : (array) \config('webhook.backoff.static.seconds', [10, 60, 300, 900, 3600]);

        if ($seconds === []) {
            return 60;
        }

        // Attempt is 1-indexed — retry #1 waits `$seconds[0]`.
        $index = \max(0, $attempt - 1);
        if ($index >= \count($seconds)) {
            $index = \count($seconds) - 1;
        }

        return (int) $seconds[$index];
    }
}
