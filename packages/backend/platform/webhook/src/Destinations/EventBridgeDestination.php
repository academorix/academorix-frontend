<?php

declare(strict_types=1);

namespace Stackra\Webhook\Destinations;

use Stackra\Webhook\Attributes\AsWebhookDestination;
use Stackra\Webhook\Contracts\Services\WebhookDestinationInterface;
use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * AWS EventBridge destination — feature-flag guarded stub.
 *
 * Ships as a stub because the AWS SDK is an optional dependency
 * (`aws/aws-sdk-php` is listed in `suggest` on the composer.json,
 * NOT in `require`). Consumer apps that enable
 * `webhook.destination.eventbridge` MUST bind a real implementation
 * via `#[Bind]` on their own concrete driver.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsWebhookDestination(
    name: 'eventbridge',
    supportsBatching: true,
    requiresConfig: ['region', 'event_bus_name', 'source'],
)]
final class EventBridgeDestination implements WebhookDestinationInterface
{
    /**
     * {@inheritDoc}
     */
    public function dispatch(
        WebhookDelivery $delivery,
        WebhookSubscription $subscription,
    ): array {
        // The stub deliberately throws so a mis-configured environment
        // (feature flag on, no SDK bound) surfaces the problem loudly
        // instead of silently no-op'ing.
        throw new \RuntimeException(
            'EventBridge destination requires the AWS SDK. Bind a real implementation via '
            . '`#[Bind(WebhookDestinationInterface::class)]` on a concrete driver.',
        );
    }
}
