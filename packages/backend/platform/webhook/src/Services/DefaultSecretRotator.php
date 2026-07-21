<?php

declare(strict_types=1);

namespace Stackra\Webhook\Services;

use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Services\SecretRotatorInterface;
use Stackra\Webhook\Events\WebhookSecretRotated;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see SecretRotatorInterface} implementation.
 *
 * Rotates the signing secret in place — current secret moves to
 * `signing_secret_previous`, a fresh secret is generated, and
 * `signing_secret_rotated_at` is set to `now()`. The rotation grace
 * window is enforced by
 * {@see WebhookSubscription::hasRotationGrace()} — after it lapses a
 * scheduled sweep clears the previous secret.
 *
 * `#[Scoped]` — a rotation touches request-scoped state (`now()` +
 * user). The interface declares the container binding via
 * `#[Bind(DefaultSecretRotator::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSecretRotator implements SecretRotatorInterface
{
    /**
     * {@inheritDoc}
     */
    public function rotate(WebhookSubscription $subscription): void
    {
        $bytes = (int) \config('webhook.signing.secret_bytes', 32);

        $current = $subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET};
        $fresh   = \bin2hex(\random_bytes($bytes));

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_SIGNING_SECRET            => $fresh,
            WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_PREVIOUS   => $current,
            WebhookSubscriptionInterface::ATTR_SIGNING_SECRET_ROTATED_AT => \now(),
        ]);

        WebhookSecretRotated::dispatch($subscription->refresh());
    }
}
