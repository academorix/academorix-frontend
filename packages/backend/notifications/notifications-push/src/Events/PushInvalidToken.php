<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Events;

use Stackra\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;

use Stackra\Events\Attributes\AsEvent;
/**
 * Provider reported a device token is no longer valid.
 *
 * Fires either from the SendPushJob (immediate at send) OR from the
 * IngestPushProviderWebhookJob (via APNs Feedback Service / FCM invalid-token
 * callback). The `ExpireSubscriptionListener` marks the subscription inactive
 * on receipt.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class PushInvalidToken implements ShouldDispatchAfterCommit
{
    public function __construct(
        public string $subscriptionId,
        public string $provider,
        public PushSubscriptionExpiredReason $reason,
    ) {
    }
}
