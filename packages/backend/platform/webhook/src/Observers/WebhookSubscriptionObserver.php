<?php

declare(strict_types=1);

namespace Stackra\Webhook\Observers;

use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Enums\WebhookSubscriptionStatus;
use Stackra\Webhook\Events\WebhookSubscriptionCreated;
use Stackra\Webhook\Events\WebhookSubscriptionDisabled;
use Stackra\Webhook\Events\WebhookSubscriptionPaused;
use Stackra\Webhook\Events\WebhookSubscriptionResumed;
use Stackra\Webhook\Events\WebhookSubscriptionUpdated;
use Stackra\Webhook\Models\WebhookSubscription;

/**
 * Lifecycle side effects on {@see WebhookSubscription}.
 *
 * ## Responsibilities
 *
 *   - `creating` — generate a signing secret when the caller did not
 *     supply one (typical path — tenants never handle secrets).
 *   - `updating` — record status transitions so the right event fires
 *     on the follow-up `updated` callback.
 *   - `created`  — emit {@see WebhookSubscriptionCreated}.
 *   - `updated`  — emit {@see WebhookSubscriptionUpdated} and the
 *     status-transition event when applicable.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionObserver
{
    /**
     * Per-instance memo of the pre-update status. Populated in
     * `updating`, consumed in `updated` so status-change events fire
     * with the accurate `from → to` transition.
     *
     * @var array<string, string>
     */
    private array $priorStatus = [];

    /**
     * `creating` — generate a signing secret when the caller did not
     * supply one. Secrets are 32 random bytes hex-encoded.
     */
    public function creating(WebhookSubscription $subscription): void
    {
        $secret = $subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET};
        if ($secret === null || $secret === '') {
            $bytes = (int) \config('webhook.signing.secret_bytes', 32);
            $subscription->{WebhookSubscriptionInterface::ATTR_SIGNING_SECRET} = \bin2hex(\random_bytes($bytes));
        }
    }

    /**
     * `updating` — snapshot the pre-update status so `updated` can
     * fire the correct transition event.
     */
    public function updating(WebhookSubscription $subscription): void
    {
        $current = (string) $subscription->getOriginal(WebhookSubscriptionInterface::ATTR_STATUS);
        $this->priorStatus[(string) $subscription->getKey()] = $current;
    }

    /**
     * `created` — dispatch the created event.
     */
    public function created(WebhookSubscription $subscription): void
    {
        WebhookSubscriptionCreated::dispatch($subscription);
    }

    /**
     * `updated` — dispatch the updated event and, when status changed,
     * the corresponding transition event (paused / resumed / disabled).
     */
    public function updated(WebhookSubscription $subscription): void
    {
        $dirty = \array_keys($subscription->getChanges());
        if ($dirty === []) {
            return;
        }

        WebhookSubscriptionUpdated::dispatch($subscription, $dirty);

        $key = (string) $subscription->getKey();
        if (! isset($this->priorStatus[$key])) {
            return;
        }

        $before = $this->priorStatus[$key];
        $after  = $this->normaliseStatus($subscription->{WebhookSubscriptionInterface::ATTR_STATUS});
        unset($this->priorStatus[$key]);

        if ($before === $after) {
            return;
        }

        if ($after === WebhookSubscriptionStatus::Paused->value) {
            WebhookSubscriptionPaused::dispatch($subscription);
        } elseif ($after === WebhookSubscriptionStatus::Active->value && $before === WebhookSubscriptionStatus::Paused->value) {
            WebhookSubscriptionResumed::dispatch($subscription);
        } elseif ($after === WebhookSubscriptionStatus::Disabled->value) {
            $reason = (string) ($subscription->{WebhookSubscriptionInterface::ATTR_DISABLED_REASON} ?? 'manual');
            WebhookSubscriptionDisabled::dispatch($subscription, $reason);
        }
    }

    /**
     * Coerce a status value (enum or raw string) to its scalar.
     */
    private function normaliseStatus(mixed $value): string
    {
        if ($value instanceof WebhookSubscriptionStatus) {
            return $value->value;
        }

        return (string) $value;
    }
}
