<?php

declare(strict_types=1);

namespace Stackra\Webhook\Jobs;

use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Repositories\WebhookSubscriptionRepositoryInterface;
use Stackra\Webhook\Enums\WebhookProbeStatus;
use Stackra\Webhook\Events\WebhookProbeFailed;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Timeout;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Hit `health_probe_url` on the subscription and record the outcome.
 *
 * Consumers wire this into a scheduled task via
 * `webhook:probe {subscription}` OR let the daily-sweep command emit
 * probes for every due subscription. On non-2xx / timeout, emit
 * {@see WebhookProbeFailed}.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Queue('webhook-probes')]
#[Timeout(30)]
#[Tries(3)]
#[Backoff(60, 300, 900)]
final class WebhookProbeJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public readonly string $subscriptionId)
    {
    }

    public function handle(
        WebhookSubscriptionRepositoryInterface $subscriptions,
        HttpFactory $http,
    ): void {
        $subscription = $subscriptions->find($this->subscriptionId);
        if ($subscription === null) {
            return;
        }

        $url = $subscription->{WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_URL};
        if (! \is_string($url) || $url === '') {
            return;
        }

        $timeout = (int) \config('webhook.probe.timeout_seconds', 10);
        $status  = WebhookProbeStatus::Unhealthy;
        $error   = null;
        $code    = null;

        try {
            $response = $http->timeout($timeout)->get($url);
            $code     = $response->status();
            if ($response->successful()) {
                $status = WebhookProbeStatus::Healthy;
            } else {
                $error = 'http_' . $code;
            }
        } catch (\Throwable $e) {
            $error = \get_class($e) . ': ' . $e->getMessage();
        }

        $subscription->update([
            WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_LAST_AT => \now(),
            WebhookSubscriptionInterface::ATTR_HEALTH_PROBE_STATUS  => $status->value,
        ]);

        if ($status === WebhookProbeStatus::Unhealthy) {
            WebhookProbeFailed::dispatch($subscription->refresh(), $code, $error);
        }
    }

    public function failed(\Throwable $e): void
    {
    }
}
