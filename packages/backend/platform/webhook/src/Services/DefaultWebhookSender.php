<?php

declare(strict_types=1);

namespace Stackra\Webhook\Services;

use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Contracts\Services\WebhookSenderInterface;
use Stackra\Webhook\Enums\WebhookDeliveryStatus;
use Stackra\Webhook\Enums\WebhookSubscriptionStatus;
use Stackra\Webhook\Exceptions\WebhookSubscriptionDisabledException;
use Stackra\Webhook\Jobs\DispatchWebhookJob;
use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default {@see WebhookSenderInterface} implementation.
 *
 * Creates a {@see WebhookDelivery} row for the (subscription, event,
 * payload) tuple then dispatches
 * {@see \Stackra\Webhook\Jobs\DispatchWebhookJob} to actually send.
 * The job owns retry + backoff behaviour; this class is the seam
 * feature modules call from their own event listeners.
 *
 * `#[Scoped]` — creating a delivery captures request-scoped context
 * (userstamps). The interface declares the container binding via
 * `#[Bind(DefaultWebhookSender::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultWebhookSender implements WebhookSenderInterface
{
    public function __construct(
        private readonly WebhookDeliveryRepositoryInterface $deliveries,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function send(
        WebhookSubscription $subscription,
        string $eventName,
        array $payload,
        ?string $eventId = null,
    ): WebhookDelivery {
        $status = $subscription->{WebhookSubscriptionInterface::ATTR_STATUS};

        // Guard: disabled subscriptions never emit deliveries.
        if ($status === WebhookSubscriptionStatus::Disabled
            || $status === WebhookSubscriptionStatus::Disabled->value
        ) {
            throw new WebhookSubscriptionDisabledException(\sprintf(
                'Subscription "%s" is disabled and cannot dispatch deliveries.',
                (string) $subscription->getKey(),
            ));
        }

        $json = \json_encode($payload, \JSON_UNESCAPED_UNICODE | \JSON_UNESCAPED_SLASHES);
        $hash = $json === false ? '' : \hash('sha256', $json);

        /** @var WebhookDelivery $delivery */
        $delivery = $this->deliveries->create([
            WebhookDeliveryInterface::ATTR_TENANT_ID       => $subscription->{WebhookSubscriptionInterface::ATTR_TENANT_ID},
            WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID => $subscription->getKey(),
            WebhookDeliveryInterface::ATTR_EVENT_NAME      => $eventName,
            WebhookDeliveryInterface::ATTR_EVENT_ID        => $eventId,
            WebhookDeliveryInterface::ATTR_API_VERSION     => $subscription->{WebhookSubscriptionInterface::ATTR_API_VERSION},
            WebhookDeliveryInterface::ATTR_PAYLOAD         => $payload,
            WebhookDeliveryInterface::ATTR_PAYLOAD_HASH    => $hash,
            WebhookDeliveryInterface::ATTR_ATTEMPT         => 1,
            WebhookDeliveryInterface::ATTR_STATUS          => WebhookDeliveryStatus::Pending->value,
        ]);

        // Paused subscriptions record the delivery but do not queue.
        if ($status === WebhookSubscriptionStatus::Paused
            || $status === WebhookSubscriptionStatus::Paused->value
        ) {
            return $delivery;
        }

        DispatchWebhookJob::dispatch((string) $delivery->getKey());

        return $delivery;
    }
}
