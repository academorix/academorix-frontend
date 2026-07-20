<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Events;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Academorix\Events\Attributes\AsEvent;
/**
 * SendPushJob's provider call failed with a non-invalid-token error.
 *
 * Retryable failures (transient network / provider 5xx) carry `$retryable
 * = true` so the notifications core can decide whether to re-enqueue.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushFailed implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $notificationId,
        public string $deliveryId,
        public string $subscriptionId,
        public string $provider,
        public string $errorCode,
        public string $errorMessage,
        public bool $retryable,
    ) {
    }
}
