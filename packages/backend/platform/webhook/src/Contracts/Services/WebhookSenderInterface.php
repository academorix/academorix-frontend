<?php

declare(strict_types=1);

namespace Stackra\Webhook\Contracts\Services;

use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;
use Stackra\Webhook\Services\DefaultWebhookSender;
use Illuminate\Container\Attributes\Bind;

/**
 * Orchestrates outbound webhook delivery.
 *
 * The default implementation
 * ({@see DefaultWebhookSender}) creates the delivery row, applies
 * the destination-driver policy, and hands off to
 * {@see \Stackra\Webhook\Jobs\DispatchWebhookJob} for the actual
 * send.
 *
 * `#[Bind(DefaultWebhookSender::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Scoped]`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(DefaultWebhookSender::class)]
interface WebhookSenderInterface
{
    /**
     * Create + queue a delivery for the given subscription.
     *
     * @param  WebhookSubscription  $subscription  The target subscription.
     * @param  string               $eventName     Dot-separated event identifier.
     * @param  array<string, mixed> $payload       Event payload snapshot.
     * @param  string|null          $eventId       Source event ULID (idempotency key).
     */
    public function send(
        WebhookSubscription $subscription,
        string $eventName,
        array $payload,
        ?string $eventId = null,
    ): WebhookDelivery;
}
