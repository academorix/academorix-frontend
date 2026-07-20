<?php

declare(strict_types=1);

namespace Academorix\Webhook\Events;

use Academorix\Events\Attributes\AsEvent;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Dispatched when a subscription auto-disables — HTTP 410 Gone from
 * the receiver, or `consecutive_failures` reached the threshold.
 *
 * `$reason` matches the `disabled_reason` column
 * (`gone_410` / `failure_threshold` / `manual` / `api_version_sunset`
 * / `tenant_suspended`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[AsEvent(name: 'webhook.subscription.disabled')]
final readonly class WebhookSubscriptionDisabled implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public WebhookSubscription $subscription,
        public string $reason,
    ) {
    }
}
