<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when an inbound webhook finishes processing (success or
 * fail — the `$success` boolean disambiguates).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.inbound.processed')]
final readonly class InboundWebhookProcessed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public string $namespace,
        public string $provider,
        public bool $success,
        public ?string $errorMessage = null,
    ) {
    }
}
