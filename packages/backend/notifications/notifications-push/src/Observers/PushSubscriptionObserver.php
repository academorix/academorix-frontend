<?php

declare(strict_types=1);

namespace Stackra\Notifications\Push\Observers;

use Stackra\Notifications\Push\Contracts\Data\PushSubscriptionInterface;
use Stackra\Notifications\Push\Contracts\Services\TokenValidatorInterface;
use Stackra\Notifications\Push\Enums\PushSubscriptionExpiredReason;
use Stackra\Notifications\Push\Events\PushSubscriptionExpired;
use Stackra\Notifications\Push\Events\PushSubscriptionRegistered;
use Stackra\Notifications\Push\Events\PushSubscriptionRevoked;
use Stackra\Notifications\Push\Exceptions\InvalidDeviceTokenException;
use Stackra\Notifications\Push\Models\PushSubscription;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Contracts\Auth\Factory as AuthFactory;

/**
 * Observer for {@see PushSubscription}.
 *
 * Owns the fingerprint compute + provider dry-run gate on `creating` and the
 * event fan-out for the lifecycle transitions the module exposes downstream.
 *
 * @category NotificationsPush
 *
 * @since    0.1.0
 */
final class PushSubscriptionObserver
{
    public function __construct(
        private readonly TokenValidatorInterface $tokenValidator,
        #[Auth] private readonly AuthFactory $auth,
    ) {
    }

    /**
     * `creating` — compute fingerprint + validate the token against the
     * provider. Fingerprint is computed BEFORE the `encrypted` cast fires
     * on save, so `$model->device_token` still holds the plaintext here.
     *
     * @throws InvalidDeviceTokenException  When the provider rejects the token.
     */
    public function creating(PushSubscription $subscription): void
    {
        $token = (string) $subscription->getAttribute(
            PushSubscriptionInterface::ATTR_DEVICE_TOKEN,
        );

        // Fingerprint is deterministic — SHA-256 of the plaintext token —
        // and non-secret. Used for admin listings + duplicate detection.
        $subscription->setAttribute(
            PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
            \hash('sha256', $token),
        );

        // Provider dry-run — fail-loud if the provider rejects the token at
        // register time. The validator honours the `token_validation.enabled`
        // config knob + caches for `cache_ttl_seconds` seconds.
        $provider = (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PROVIDER);
        $platform = (string) $subscription->getAttribute(PushSubscriptionInterface::ATTR_PLATFORM);

        if (! $this->tokenValidator->validate($provider, $platform, $token)) {
            throw new InvalidDeviceTokenException(
                \sprintf('Provider "%s" rejected the device token during registration.', $provider),
            );
        }

        // Auto-fill last_seen_at on first register so idle-prune has a
        // baseline.
        if ($subscription->getAttribute(PushSubscriptionInterface::ATTR_LAST_SEEN_AT) === null) {
            $subscription->setAttribute(
                PushSubscriptionInterface::ATTR_LAST_SEEN_AT,
                now(),
            );
        }
    }

    /**
     * `created` — announce the fresh subscription.
     */
    public function created(PushSubscription $subscription): void
    {
        event(new PushSubscriptionRegistered($subscription));
    }

    /**
     * `updated` — detect a transition to inactive + fire the expired event
     * with the appropriate reason.
     */
    public function updated(PushSubscription $subscription): void
    {
        // Provider reported invalid token: `is_active` flipped to false AND
        // `invalid_token_reported_at` was set in the same save. That's the
        // canonical "expired via invalid token" signature.
        if (
            $subscription->wasChanged(PushSubscriptionInterface::ATTR_IS_ACTIVE)
            && $subscription->getAttribute(PushSubscriptionInterface::ATTR_IS_ACTIVE) === false
            && $subscription->getAttribute(PushSubscriptionInterface::ATTR_INVALID_TOKEN_REPORTED_AT) !== null
        ) {
            event(new PushSubscriptionExpired(
                $subscription,
                PushSubscriptionExpiredReason::InvalidToken,
            ));
        }
    }

    /**
     * `deleted` — soft-delete emits the revoke event.
     */
    public function deleted(PushSubscription $subscription): void
    {
        // The auth guard MAY be missing during background jobs (queue
        // workers, artisan) — fall back to null.
        $revokedByUserId = null;
        $user = $this->auth->guard()->user();
        if ($user !== null && \method_exists($user, 'getKey')) {
            $revokedByUserId = (string) $user->getKey();
        }

        event(new PushSubscriptionRevoked($subscription, $revokedByUserId));
    }
}
