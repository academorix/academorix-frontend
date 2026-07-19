<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an inbound webhook arrives at the central receiver
 * and passes the signature check.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.inbound.received')]
final readonly class InboundWebhookReceived implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  array<string, mixed>  $payload  Decoded JSON payload.
     * @param  array<string, mixed>  $headers  Sanitised request headers.
     */
    public function __construct(
        public string $namespace,
        public string $provider,
        public array $payload,
        public array $headers,
    ) {
    }
}
