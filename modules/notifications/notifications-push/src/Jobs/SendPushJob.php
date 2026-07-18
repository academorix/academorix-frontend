<?php

declare(strict_types=1);

namespace Academorix\Notifications\Push\Jobs;

use Academorix\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Academorix\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Academorix\Notifications\Push\Contracts\Services\PushTransportManagerInterface;
use Academorix\Notifications\Push\Data\PushEnvelope;
use Academorix\Notifications\Push\Enums\PushPlatform;
use Academorix\Notifications\Push\Enums\PushProvider;
use Academorix\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Academorix\Notifications\Push\Events\PushFailed;
use Academorix\Notifications\Push\Events\PushInvalidToken;
use Academorix\Notifications\Push\Events\PushSent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Deliver one push notification to every active subscription for a user +
 * application pair.
 *
 * ## Flow
 *
 *  1. Enumerate active subscriptions via the repository.
 *  2. For each subscription, decrypt the token (via the Eloquent cast on read)
 *     and hand the envelope to the transport manager.
 *  3. On provider accept: fire {@see PushSent}.
 *  4. On invalid-token: fire {@see PushInvalidToken} — the listener flips
 *     `is_active` on the subscription.
 *  5. On retryable error: fire {@see PushFailed} with retryable=true.
 *  6. On permanent error: fire {@see PushFailed} with retryable=false.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(4)]
#[Backoff([30, 120, 600, 3600])]
final class SendPushJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $notificationId,
        public readonly string $deliveryId,
        public readonly string $userId,
        public readonly string $applicationId,
        public readonly string $title,
        public readonly string $body,
        /** @var array<string, mixed> */
        public readonly array $data = [],
    ) {
    }

    /**
     * Unique key so simultaneous dispatches to the same delivery collapse.
     */
    #[UniqueFor(300)]
    public function uniqueId(): string
    {
        return $this->deliveryId;
    }

    /**
     * Handle the job — fan out to every active subscription.
     */
    public function handle(
        PushSubscriptionRepositoryInterface $subscriptions,
        PushTransportManagerInterface $manager,
    ): void {
        $rows = $subscriptions->findActiveForUserAndApplication(
            $this->userId,
            $this->applicationId,
        );

        foreach ($rows as $subscription) {
            $envelope = new PushEnvelope(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: PushProvider::from(
                    (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PROVIDER),
                ),
                platform: PushPlatform::from(
                    (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PLATFORM),
                ),
                deviceToken: (string) $subscription->getAttribute(
                    PushSubscriptionInterface::ATTR_DEVICE_TOKEN,
                ),
                title: $this->title,
                body: $this->body,
                data: $this->data,
            );

            try {
                $result = $manager->driver($envelope->provider->value)->send($envelope);
            } catch (Throwable $e) {
                // Provider driver blew up — treat as retryable per-provider
                // error so the delivery is re-attempted on backoff.
                event(new PushFailed(
                    notificationId: $this->notificationId,
                    deliveryId: $this->deliveryId,
                    subscriptionId: (string) $subscription->getKey(),
                    provider: $envelope->provider->value,
                    errorCode: 'provider_exception',
                    errorMessage: $e->getMessage(),
                    retryable: true,
                ));
                continue;
            }

            if ($result->invalidToken) {
                event(new PushInvalidToken(
                    subscriptionId: (string) $subscription->getKey(),
                    provider: $envelope->provider->value,
                    reason: PushSubscriptionExpiredReason::InvalidToken,
                ));
                continue;
            }

            if (! $result->accepted) {
                event(new PushFailed(
                    notificationId: $this->notificationId,
                    deliveryId: $this->deliveryId,
                    subscriptionId: (string) $subscription->getKey(),
                    provider: $envelope->provider->value,
                    errorCode: (string) $result->errorCode,
                    errorMessage: (string) $result->errorMessage,
                    retryable: $result->retryable,
                ));
                continue;
            }

            event(new PushSent(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                subscriptionId: (string) $subscription->getKey(),
                provider: $envelope->provider->value,
                providerMessageId: (string) $result->providerMessageId,
                platform: $envelope->platform->value,
            ));
        }
    }

    /**
     * Called by the queue worker when all retries are exhausted.
     */
    public function failed(Throwable $e): void
    {
        // Fail-soft — the notifications core has already recorded the
        // delivery attempt; we log the ultimate cause + let the observability
        // pipeline pick it up.
        \report($e);
    }
}
