<?php

declare(strict_types=1);

namespace Stackra\Subscription\Middleware;

use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Exceptions\SubscriptionStateNotAllowedException;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuse the request unless the tenant's subscription state is IN
 * the caller-supplied allow-list.
 *
 * ```php
 * #[Middleware(['subscription.state:active,trialing'])]
 * ```
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'subscription.state', groups: [], priority: 58)]
final class RequireSubscriptionState
{
    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Handle the request. Additional parameters are the allowed
     * state values (comma-separated in the route middleware string).
     */
    public function handle(Request $request, Closure $next, string ...$allowedStates): Response
    {
        if ($allowedStates === []) {
            // No allow-list — nothing to enforce; behave as a passthrough.
            return $next($request);
        }

        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            return $next($request);
        }

        $tenantId = (string) $tenant->getKey();
        $subscription = $this->subscriptions->findActiveForTenant($tenantId);

        $stateValue = $subscription === null
            ? 'missing'
            : $this->stateValue($subscription);

        if (! \in_array($stateValue, $allowedStates, strict: true)) {
            throw new SubscriptionStateNotAllowedException(\sprintf(
                'Subscription state "%s" is not in the allowed set (%s).',
                $stateValue,
                \implode(', ', $allowedStates),
            ));
        }

        return $next($request);
    }

    /**
     * Normalise a subscription's state to its scalar backing value.
     */
    private function stateValue(\Stackra\Subscription\Models\Subscription $subscription): string
    {
        $state = $subscription->{SubscriptionInterface::ATTR_STATE};

        return $state instanceof SubscriptionState ? $state->value : (string) $state;
    }
}
