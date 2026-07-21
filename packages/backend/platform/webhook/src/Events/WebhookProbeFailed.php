<?php

declare(strict_types=1);

namespace Stackra\Webhook\Events;

use Stackra\Events\Attributes\AsEvent;
use Stackra\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a health probe on `health_probe_url` returns a
 * non-2xx status.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.probe.failed')]
final readonly class WebhookProbeFailed implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookSubscription $subscription,
        public ?int $httpStatusCode,
        public ?string $errorMessage,
    ) {
    }
}
