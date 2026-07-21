<?php

declare(strict_types=1);

namespace Stackra\Webhook\Services;

use Stackra\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Stackra\Webhook\Contracts\Services\BackoffStrategyResolverInterface;
use Stackra\Webhook\Models\WebhookSubscription;
use Stackra\Webhook\Strategies\RetryAfterAwareBackoffStrategy;
use Stackra\Webhook\Strategies\StaticArrayBackoffStrategy;
use Illuminate\Container\Attributes\Singleton;

/**
 * Default {@see BackoffStrategyResolverInterface} implementation.
 *
 * Dispatches on the subscription's `backoff_strategy` column — the
 * value MUST be one of the keys registered here (`static`,
 * `retry-after-aware`). Unknown strategies fall back to `static`.
 *
 * `#[Singleton]` — the resolver is stateless; the underlying strategies
 * are pure functions of the subscription + attempt + last response.
 * The interface declares the container binding via
 * `#[Bind(DefaultBackoffStrategyResolver::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultBackoffStrategyResolver implements BackoffStrategyResolverInterface
{
    public function __construct(
        private readonly StaticArrayBackoffStrategy $static = new StaticArrayBackoffStrategy(),
        private readonly RetryAfterAwareBackoffStrategy $retryAfterAware = new RetryAfterAwareBackoffStrategy(),
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(
        WebhookSubscription $subscription,
        int $attempt,
        array $lastResponse,
    ): int {
        $key = (string) $subscription->{WebhookSubscriptionInterface::ATTR_BACKOFF_STRATEGY};

        return match ($key) {
            'retry-after-aware' => $this->retryAfterAware->resolve($subscription, $attempt, $lastResponse),
            default             => $this->static->resolve($subscription, $attempt),
        };
    }
}
