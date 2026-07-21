<?php

declare(strict_types=1);

namespace Stackra\Webhook\Destinations;

use Stackra\Webhook\Attributes\AsWebhookDestination;
use Stackra\Webhook\Contracts\Services\WebhookDestinationInterface;
use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * GCP Pub/Sub destination — feature-flag guarded stub.
 *
 * Ships as a stub because `google/cloud-pubsub` is an optional
 * dependency listed in `suggest`. Consumer apps that enable
 * `webhook.destination.pubsub` MUST bind a real implementation via
 * `#[Bind]` on their own concrete driver.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsWebhookDestination(
    name: 'pubsub',
    supportsBatching: true,
    requiresConfig: ['project_id', 'topic_name'],
)]
final class PubSubDestination implements WebhookDestinationInterface
{
    /**
     * {@inheritDoc}
     */
    public function dispatch(
        WebhookDelivery $delivery,
        WebhookSubscription $subscription,
    ): array {
        throw new \RuntimeException(
            'PubSub destination requires the Google Cloud SDK. Bind a real implementation via '
            . '`#[Bind(WebhookDestinationInterface::class)]` on a concrete driver.',
        );
    }
}
