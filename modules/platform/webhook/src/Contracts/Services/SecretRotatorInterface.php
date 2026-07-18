<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Services;

use Academorix\Webhook\Models\WebhookSubscription;
use Academorix\Webhook\Services\DefaultSecretRotator;
use Illuminate\Container\Attributes\Bind;

/**
 * Rotates the signing secret on a webhook subscription.
 *
 * A rotation:
 *   1. Moves the current secret into `signing_secret_previous`.
 *   2. Generates a fresh secret and writes it to `signing_secret`.
 *   3. Sets `signing_secret_rotated_at` to `now()`.
 *
 * During the grace window (default 24h per config) every outbound
 * request carries BOTH signatures so receivers can migrate without
 * downtime. After the window a scheduled job clears the previous
 * secret.
 *
 * `#[Bind(DefaultSecretRotator::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Scoped]`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(DefaultSecretRotator::class)]
interface SecretRotatorInterface
{
    /**
     * Rotate the subscription's signing secret in place.
     */
    public function rotate(WebhookSubscription $subscription): void;
}
