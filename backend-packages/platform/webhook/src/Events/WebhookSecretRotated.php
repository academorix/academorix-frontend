<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subscription's signing secret is rotated.
 *
 * Consumers (audit log, admin notifications) subscribe to warn the
 * tenant admin about the rotation grace window.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.secret.rotated')]
final readonly class WebhookSecretRotated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(public WebhookSubscription $subscription)
    {
    }
}
