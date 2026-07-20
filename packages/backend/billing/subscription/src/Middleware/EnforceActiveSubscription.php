<?php

declare(strict_types=1);

namespace Academorix\Subscription\Middleware;

use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Contracts\Repositories\SubscriptionRepositoryInterface;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Exceptions\SubscriptionActiveRequiredException;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuse the request when the tenant's subscription is in a
 * restrictive state (grace / suspended / cancelled).
 *
 * ```php
 * #[Middleware(['api', 'subscription.active'])]
 * ```
 *
 * The response carries the current state + upgrade path so the UI
 * can direct the operator to the billing page.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'subscription.active', groups: [], priority: 58)]
final class EnforceActiveSubscription
{
    public function __construct(
        private readonly SubscriptionRepositoryInterface $subscriptions,
        private readonly TenantContextInterface $tenantContext,
    ) {
    }

    /**
     * Handle the request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // The master enforcer kill-switch — flip off in emergencies.
        if ((bool) \config('subscription.enforcer.enabled', true) === false) {
            return $next($request);
        }

        $tenant = $this->tenantContext->current();
        if ($tenant === null) {
            // No tenant resolved — the request is upstream of tenant
            // resolution; there is nothing to enforce.
            return $next($request);
        }

        $tenantId = (string) $tenant->getKey();
        $subscription = $this->subscriptions->findActiveForTenant($tenantId);

        if ($subscription === null) {
            throw SubscriptionActiveRequiredException::forState($tenantId, 'missing');
        }

        $stateValue = $this->stateValue($subscription);
        $restrictive = \array_map(
            static fn (SubscriptionState $s): string => $s->value,
            SubscriptionState::restrictive(),
        );

        if (\in_array($stateValue, $restrictive, strict: true)) {
            throw SubscriptionActiveRequiredException::forState($tenantId, $stateValue);
        }

        return $next($request);
    }

    /**
     * Normalise a subscription's state to its scalar backing value.
     */
    private function stateValue(\Academorix\Subscription\Models\Subscription $subscription): string
    {
        $state = $subscription->{SubscriptionInterface::ATTR_STATE};

        return $state instanceof SubscriptionState ? $state->value : (string) $state;
    }
}
