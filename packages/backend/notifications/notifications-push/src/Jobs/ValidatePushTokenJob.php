<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Jobs;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Repositories\PushSubscriptionRepositoryInterface;
use Stackra\Notifications\Push\Contracts\Services\TokenValidatorInterface;
use Stackra\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Stackra\Notifications\Push\Events\PushInvalidToken;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Async re-validation of a device token.
 *
 * Dispatched on suspicion of provider revocation (e.g., a delivery failed with
 * an ambiguous error). Fires {@see PushInvalidToken} if the token is confirmed
 * invalid on re-check.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(2)]
final class ValidatePushTokenJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $subscriptionId,
    ) {
    }

    #[UniqueFor(300)]
    public function uniqueId(): string
    {
        return $this->subscriptionId;
    }

    public function handle(
        PushSubscriptionRepositoryInterface $subscriptions,
        TokenValidatorInterface $validator,
    ): void {
        $subscription = $subscriptions->find($this->subscriptionId);
        if ($subscription === null) {
            return;
        }

        $provider = (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PROVIDER);
        $platform = (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PLATFORM);
        $token    = (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_DEVICE_TOKEN);

        if ($validator->validate($provider, $platform, $token)) {
            return;
        }

        event(new PushInvalidToken(
            subscriptionId: $this->subscriptionId,
            provider: $provider,
            reason: PushSubscriptionExpiredReason::InvalidToken,
        ));
    }
}
