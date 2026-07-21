<?php

declare(strict_types=1);

namespace Stackra\Webhook\Jobs;

use Stackra\Webhook\Contracts\Data\WebhookDeliveryInterface;
use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookDeliveryRepositoryInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Contracts\Services\BackoffStrategyResolverInterface;
use Stackra\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;
use Stackra\Webhook\Enums\WebhookDeliveryStatus;
use Stackra\Webhook\Enums\WebhookSubscriptionStatus;
use Stackra\Webhook\Events\WebhookDelivered;
use Stackra\Webhook\Events\WebhookDeliveryFailed;
use Stackra\Webhook\Events\WebhookDeliveryFailedPermanent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\RateLimiter;

/**
 * Send one {@see \Stackra\Webhook\Models\WebhookDelivery} attempt
 * to its destination.
 *
 * `#[Tries(1)]` — the queue does NOT retry. Retries are scheduled by
 * this job via {@see BackoffStrategyResolverInterface} which creates
 * a new delivery row (attempt + 1) and re-dispatches with a delay.
 * This keeps every attempt visible in the audit trail with its own
 * response snapshot.
 *
 * Rate limiting is enforced pre-dispatch — an over-quota subscription
 * defers by 60 seconds via `release()`.
 *
 * Auto-disable rules:
 *   - HTTP 410 → subscription flips to `disabled` (`gone_410`).
 *   - `consecutive_failures` reaches the threshold → `failure_threshold`.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Queue('webhooks')]
#[Timeout(60)]
#[Tries(1)]
final class DispatchWebhookJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $deliveryId)
    {
    }

    /**
     * Send the delivery. On failure, either schedule a retry (creates
     * a new attempt row) or mark the delivery `failed_permanent`.
     */
    public function handle(
        WebhookDeliveryRepositoryInterface $deliveries,
        WebhookSubscriptionRepositoryInterface $subscriptions,
        WebhookDestinationRegistryInterface $registry,
        BackoffStrategyResolverInterface $backoff,
    ): void {
        $delivery = $deliveries->find($this->deliveryId);
        if ($delivery === null) {
            return;
        }

        $subscription = $subscriptions->find(
            (string) $delivery->{WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID},
        );

        if ($subscription === null) {
            $this->markFailedPermanent($delivery, null, 'subscription_missing');

            return;
        }

        $subscriptionStatus = $subscription->{WebhookSubscriptionInterface::ATTR_STATUS};

        // Never dispatch through a disabled subscription.
        if ($subscriptionStatus === WebhookSubscriptionStatus::Disabled
            || $subscriptionStatus === WebhookSubscriptionStatus::Disabled->value
        ) {
            $this->markFailedPermanent($delivery, null, 'subscription_disabled');

            return;
        }

        // Paused subscriptions defer indefinitely (waiting for resume).
        if ($subscriptionStatus === WebhookSubscriptionStatus::Paused
            || $subscriptionStatus === WebhookSubscriptionStatus::Paused->value
        ) {
            $this->release(300);

            return;
        }

        // Enforce the per-minute rate limit.
        $limit = (int) ($subscription->{WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE}
            ?? \config('webhook.rate_limit.default_per_minute', 60));
        if ($limit > 0) {
            $key = 'webhook:sub:' . $subscription->getKey();
            if (RateLimiter::tooManyAttempts($key, $limit)) {
                $this->release(60);

                return;
            }
            RateLimiter::hit($key, 60);
        }

        // Update status → dispatching.
        $delivery->update([
            WebhookDeliveryInterface::ATTR_STATUS        => WebhookDeliveryStatus::Dispatching->value,
            WebhookDeliveryInterface::ATTR_DISPATCHED_AT => \now(),
        ]);

        try {
            $driver = $registry->resolve(
                (string) $subscription->{WebhookSubscriptionInterface::ATTR_DESTINATION},
            );
        } catch (\Throwable $e) {
            $this->markFailedPermanent($delivery, null, 'driver_resolve: ' . $e->getMessage());

            return;
        }

        try {
            $result = $driver->dispatch($delivery, $subscription);
        } catch (\Throwable $e) {
            $result = [
                'ok'               => false,
                'http_status'      => null,
                'response_headers' => null,
                'response_body'    => null,
                'latency_ms'       => 0,
                'error'            => \get_class($e) . ': ' . $e->getMessage(),
            ];
        }

        $delivery->update([
            WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => $result['http_status'],
            WebhookDeliveryInterface::ATTR_RESPONSE_HEADERS => $result['response_headers'],
            WebhookDeliveryInterface::ATTR_RESPONSE_BODY    => $this->truncate($result['response_body']),
            WebhookDeliveryInterface::ATTR_LATENCY_MS       => $result['latency_ms'],
        ]);

        if ($result['ok'] === true) {
            $this->markDelivered($delivery, $subscription, (int) $result['http_status'], (int) $result['latency_ms']);

            return;
        }

        // HTTP 410 Gone → hard auto-disable, no retry.
        if ($result['http_status'] === (int) \config('webhook.auto_disable.gone_status_code', 410)) {
            $this->markFailedPermanent($delivery, $result['http_status'], $result['error']);
            $this->autoDisable($subscription, 'gone_410');

            return;
        }

        // Retryable failure — compute next delay via the resolver.
        $this->handleRetryable($delivery, $subscription, $result, $backoff);
    }

    /**
     * `failed()` — invoked when the queue gives up (tries = 1, so we
     * generally do our own retry orchestration). Kept for future
     * observability wiring.
     */
    public function failed(\Throwable $e): void
    {
    }

    // ── Internals ───────────────────────────────────────────────────

    /**
     * Mark the delivery `delivered`, reset the subscription's failure
     * counter, and emit {@see WebhookDelivered}.
     */
    private function markDelivered(
        \Stackra\Webhook\Models\WebhookDelivery $delivery,
        \Stackra\Webhook\Models\WebhookSubscription $subscription,
        int $httpStatus,
        int $latencyMs,
    ): void {
        $delivery->update([
            WebhookDeliveryInterface::ATTR_STATUS       => WebhookDeliveryStatus::Delivered->value,
            WebhookDeliveryInterface::ATTR_DELIVERED_AT => \now(),
        ]);

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES => 0,
            WebhookSubscriptionInterface::ATTR_LAST_DELIVERY_AT     => \now(),
        ]);

        WebhookDelivered::dispatch($delivery->refresh(), $httpStatus, $latencyMs);
    }

    /**
     * Retryable failure — compute next delay, create the next attempt
     * row, and re-dispatch. When the retry budget is exhausted or the
     * failure-threshold is crossed, mark permanent + auto-disable.
     *
     * @param  array<string, mixed>  $result
     */
    private function handleRetryable(
        \Stackra\Webhook\Models\WebhookDelivery $delivery,
        \Stackra\Webhook\Models\WebhookSubscription $subscription,
        array $result,
        BackoffStrategyResolverInterface $backoff,
    ): void {
        $attempt   = (int) $delivery->{WebhookDeliveryInterface::ATTR_ATTEMPT};
        $failures  = (int) $subscription->{WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES} + 1;
        $threshold = (int) \config('webhook.auto_disable.failure_threshold', 30);

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES => $failures,
        ]);

        // Compute next retry delay from the strategy.
        $delaySeconds = $backoff->resolve($subscription, $attempt, $result);
        $retryAt      = \now()->addSeconds($delaySeconds);

        $delivery->update([
            WebhookDeliveryInterface::ATTR_STATUS        => WebhookDeliveryStatus::Failed->value,
            WebhookDeliveryInterface::ATTR_FAILED_AT     => \now(),
            WebhookDeliveryInterface::ATTR_RETRY_AT      => $retryAt,
            WebhookDeliveryInterface::ATTR_ERROR_MESSAGE => (string) $result['error'],
        ]);

        WebhookDeliveryFailed::dispatch(
            $delivery->refresh(),
            $attempt,
            \is_int($result['http_status']) ? $result['http_status'] : null,
            \is_string($result['error']) ? $result['error'] : null,
        );

        // Consecutive-failure threshold → auto-disable + permanent.
        if ($failures >= $threshold) {
            $this->markFailedPermanent(
                $delivery,
                \is_int($result['http_status']) ? $result['http_status'] : null,
                'failure_threshold',
            );
            $this->autoDisable($subscription, 'failure_threshold');

            return;
        }

        // Create the next attempt row and schedule its dispatch.
        /** @var \Stackra\Webhook\Models\WebhookDelivery $next */
        $next = $delivery->newInstance();
        $next->forceFill([
            WebhookDeliveryInterface::ATTR_TENANT_ID       => $delivery->{WebhookDeliveryInterface::ATTR_TENANT_ID},
            WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID => $delivery->{WebhookDeliveryInterface::ATTR_SUBSCRIPTION_ID},
            WebhookDeliveryInterface::ATTR_EVENT_NAME      => $delivery->{WebhookDeliveryInterface::ATTR_EVENT_NAME},
            WebhookDeliveryInterface::ATTR_EVENT_ID        => $delivery->{WebhookDeliveryInterface::ATTR_EVENT_ID},
            WebhookDeliveryInterface::ATTR_API_VERSION     => $delivery->{WebhookDeliveryInterface::ATTR_API_VERSION},
            WebhookDeliveryInterface::ATTR_PAYLOAD         => $delivery->{WebhookDeliveryInterface::ATTR_PAYLOAD},
            WebhookDeliveryInterface::ATTR_PAYLOAD_HASH    => $delivery->{WebhookDeliveryInterface::ATTR_PAYLOAD_HASH},
            WebhookDeliveryInterface::ATTR_ATTEMPT         => $attempt + 1,
            WebhookDeliveryInterface::ATTR_STATUS          => WebhookDeliveryStatus::Pending->value,
        ]);
        $next->save();

        self::dispatch((string) $next->getKey())->delay($retryAt);
    }

    /**
     * Mark the delivery `failed_permanent` + emit the event.
     */
    private function markFailedPermanent(
        \Stackra\Webhook\Models\WebhookDelivery $delivery,
        ?int $httpStatus,
        ?string $error,
    ): void {
        $delivery->update([
            WebhookDeliveryInterface::ATTR_STATUS        => WebhookDeliveryStatus::FailedPermanent->value,
            WebhookDeliveryInterface::ATTR_FAILED_AT     => \now(),
            WebhookDeliveryInterface::ATTR_ERROR_MESSAGE => $error,
            WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE => $httpStatus ?? $delivery->{WebhookDeliveryInterface::ATTR_HTTP_STATUS_CODE},
        ]);

        WebhookDeliveryFailedPermanent::dispatch($delivery->refresh(), $httpStatus, $error);
    }

    /**
     * Flip the subscription to `disabled` and record the reason.
     */
    private function autoDisable(
        \Stackra\Webhook\Models\WebhookSubscription $subscription,
        string $reason,
    ): void {
        $subscription->update([
            WebhookSubscriptionInterface::ATTR_STATUS          => WebhookSubscriptionStatus::Disabled->value,
            WebhookSubscriptionInterface::ATTR_DISABLED_AT     => \now(),
            WebhookSubscriptionInterface::ATTR_DISABLED_REASON => $reason,
        ]);
    }

    /**
     * Truncate the response body to the configured cap (default 64KB
     * per config, 4KB per the module task list — the config wins).
     */
    private function truncate(?string $body): ?string
    {
        if ($body === null) {
            return null;
        }

        $max = (int) \config('webhook.http.max_response_body_bytes', 4096);

        return \strlen($body) > $max ? \substr($body, 0, $max) : $body;
    }
}
