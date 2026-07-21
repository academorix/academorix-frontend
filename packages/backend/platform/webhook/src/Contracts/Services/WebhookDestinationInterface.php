<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Services;

use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * A pluggable destination driver.
 *
 * Implementations know how to hand a {@see WebhookDelivery} to their
 * target. HTTPS ships in v1; EventBridge / PubSub / mTLS are
 * feature-flag guarded stubs that throw at dispatch time until a
 * consumer app binds a concrete implementation.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
interface WebhookDestinationInterface
{
    /**
     * Dispatch the delivery to the destination.
     *
     * The returned array is the mutation snapshot the sender applies
     * to the {@see WebhookDelivery} row (status / http_status_code /
     * response_headers / response_body / latency_ms / error).
     *
     * @param  WebhookDelivery      $delivery      The delivery being dispatched.
     * @param  WebhookSubscription  $subscription  The parent subscription.
     * @return array{
     *     ok: bool,
     *     http_status: int|null,
     *     response_headers: array<string, mixed>|null,
     *     response_body: string|null,
     *     latency_ms: int,
     *     error: string|null,
     * }
     */
    public function dispatch(
        WebhookDelivery $delivery,
        WebhookSubscription $subscription,
    ): array;
}
