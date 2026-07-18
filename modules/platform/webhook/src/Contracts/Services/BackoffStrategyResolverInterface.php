<?php

declare(strict_types=1);

namespace Academorix\Webhook\Contracts\Services;

use Academorix\Webhook\Models\WebhookSubscription;
use Academorix\Webhook\Services\DefaultBackoffStrategyResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Resolves the next retry delay for a failed delivery.
 *
 * Two strategies ship in v1:
 *   - `static` — fixed schedule from `backoff_config.seconds`.
 *   - `retry-after-aware` — honours the receiver's `Retry-After` header
 *     on 429 / 503; falls back to the static array when absent.
 *
 * The resolver dispatches to the strategy named by the subscription's
 * `backoff_strategy` column.
 *
 * `#[Bind(DefaultBackoffStrategyResolver::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Singleton]`).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Bind(DefaultBackoffStrategyResolver::class)]
interface BackoffStrategyResolverInterface
{
    /**
     * Compute the delay (seconds) until the next retry.
     *
     * @param  WebhookSubscription      $subscription  Owning subscription.
     * @param  int                      $attempt       1-indexed current attempt number.
     * @param  array<string, mixed>     $lastResponse  Snapshot of the failing response (status, headers).
     * @return int  Seconds until the next retry. Return 0 to retry immediately.
     */
    public function resolve(
        WebhookSubscription $subscription,
        int $attempt,
        array $lastResponse,
    ): int;
}
