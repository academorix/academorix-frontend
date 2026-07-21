<?php

declare(strict_types=1);

namespace Stackra\Webhook\Destinations;

use Stackra\Webhook\Attributes\AsWebhookDestination;
use Stackra\Webhook\Contracts\Services\WebhookDestinationInterface;
use Stackra\Webhook\Models\WebhookDelivery;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * mTLS HTTPS destination — feature-flag guarded stub.
 *
 * Ships as a stub because client-certificate management is an
 * infrastructure concern (secrets, rotation, cert lifecycle). Consumer
 * apps that enable `webhook.destination.mtls` MUST bind a real
 * implementation via `#[Bind]` on their own concrete driver, wiring
 * up cert / key / CA-bundle paths through a secrets manager.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsWebhookDestination(
    name: 'mtls-https',
    supportsBatching: false,
    requiresConfig: ['url', 'client_cert_path', 'client_key_path', 'ca_bundle_path'],
)]
final class MtlsHttpsDestination implements WebhookDestinationInterface
{
    /**
     * {@inheritDoc}
     */
    public function dispatch(
        WebhookDelivery $delivery,
        WebhookSubscription $subscription,
    ): array {
        throw new \RuntimeException(
            'mTLS HTTPS destination requires a client-certificate loader. Bind a real '
            . 'implementation via `#[Bind(WebhookDestinationInterface::class)]` on a concrete driver.',
        );
    }
}
