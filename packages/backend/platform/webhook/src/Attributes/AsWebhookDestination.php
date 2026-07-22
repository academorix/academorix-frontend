<?php

declare(strict_types=1);

namespace Stackra\Webhook\Attributes;

use Attribute;

/**
 * Register a destination-driver class with
 * {@see \Stackra\Webhook\Registry\WebhookDestinationRegistry}.
 *
 * A destination driver implements
 * {@see \Stackra\Webhook\Contracts\Services\WebhookDestinationInterface}
 * and knows how to dispatch a
 * {@see \Stackra\Webhook\Models\WebhookDelivery} to its target
 * (HTTPS endpoint, EventBridge bus, Pub/Sub topic, mTLS receiver).
 *
 * ```php
 * #[AsWebhookDestination(
 *     name: 'eventbridge',
 *     supportsBatching: true,
 *     requiresConfig: ['region', 'event_bus_name'],
 * )]
 * final class EventBridgeDestination implements WebhookDestinationInterface
 * {
 * }
 * ```
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsWebhookDestination
{
    /**
     * @param  string        $name              Driver key (e.g. `https`, `eventbridge`).
     * @param  bool          $supportsBatching  Whether the driver can send N deliveries in one call.
     * @param  list<string>  $requiresConfig    Names of required keys in `destination_config`.
     */
    public function __construct(
        public string $name,
        public bool $supportsBatching = false,
        public array $requiresConfig = [],
    ) {
    }
}
