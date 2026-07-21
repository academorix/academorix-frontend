<?php

declare(strict_types=1);

namespace Stackra\Subscription\Services;

use Stackra\Subscription\Contracts\Data\PlanInterface;
use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Contracts\Services\BillingServiceInterface;
use Stackra\Subscription\Contracts\Services\CashierAdapterInterface;
use Stackra\Subscription\Enums\BillingMode;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Events\SubscriptionReinstated;
use Stackra\Subscription\Exceptions\PlanArchivedException;
use Stackra\Subscription\Exceptions\PlanDeprecatedException;
use Stackra\Subscription\Models\Plan;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Container\Attributes\Scoped;

/**
 * Default implementation of {@see BillingServiceInterface}.
 *
 * Delegates provider round-trips to
 * {@see CashierAdapterInterface} and owns the mutation of our own
 * Subscription state. Every state / plan change fires the
 * Subscription observer, which in turn fires the domain events.
 *
 * `#[Scoped]` because callers reach for this service inside HTTP
 * actions — one instance per request, no state leaked between
 * tenants.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultBillingService implements BillingServiceInterface
{
    public function __construct(
        private readonly CashierAdapterInterface $cashier,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function startCheckout(string $tenantId, Plan $plan): ?string
    {
        $this->assertPlanIsBookable($plan);

        // Invoice-billed plans never round-trip Cashier — the return
        // is null so the action can hand back a workflow response
        // instead of a redirect URL.
        $billingMode = $plan->{PlanInterface::ATTR_BILLING_MODE};
        if ($billingMode === BillingMode::Invoice || $billingMode === BillingMode::Invoice->value) {
            return null;
        }

        $priceId = (string) ($plan->{PlanInterface::ATTR_PROVIDER_PRICE_ID} ?? '');
        if ($priceId === '') {
            return null;
        }

        return $this->cashier->createCheckoutSession($tenantId, $priceId);
    }

    /**
     * {@inheritDoc}
     */
    public function swapPlan(Subscription $subscription, Plan $newPlan): Subscription
    {
        $this->assertPlanIsBookable($newPlan);

        // Setting plan_id triggers SubscriptionObserver which fires
        // the matching upgrade / downgrade / switch event.
        $subscription->{SubscriptionInterface::ATTR_PLAN_ID} = (string) $newPlan->getKey();
        $subscription->{SubscriptionInterface::ATTR_BILLING_CYCLE} = $newPlan->{PlanInterface::ATTR_BILLING_CYCLE};
        $subscription->save();

        return $subscription;
    }

    /**
     * {@inheritDoc}
     */
    public function cancel(Subscription $subscription, bool $atPeriodEnd = true, ?string $reason = null): Subscription
    {
        // Reason is captured on metadata for the SOX event; the
        // subscription observer picks it up on the state transition.
        $metadata = $subscription->{SubscriptionInterface::ATTR_METADATA} ?? [];
        if ($reason !== null && \is_array($metadata)) {
            $metadata['cancel_reason'] = $reason;
            $subscription->{SubscriptionInterface::ATTR_METADATA} = $metadata;
        }

        $subscription->{SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END} = $atPeriodEnd;

        if ($atPeriodEnd === false) {
            $subscription->{SubscriptionInterface::ATTR_STATE} = SubscriptionState::Cancelled->value;
            $subscription->{SubscriptionInterface::ATTR_CANCELLED_AT} = \now();
        }

        $subscription->save();

        return $subscription;
    }

    /**
     * {@inheritDoc}
     */
    public function reinstate(Subscription $subscription): Subscription
    {
        $subscription->{SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END} = false;
        $subscription->{SubscriptionInterface::ATTR_REINSTATED_AT} = \now();
        $subscription->save();

        SubscriptionReinstated::dispatch($subscription);

        return $subscription;
    }

    /**
     * Refuse checkout / swap onto a plan that isn't bookable.
     *
     * @throws PlanArchivedException
     * @throws PlanDeprecatedException
     */
    private function assertPlanIsBookable(Plan $plan): void
    {
        if ($plan->{PlanInterface::ATTR_ARCHIVED_AT} !== null) {
            throw new PlanArchivedException(\sprintf(
                'Plan "%s" is archived and cannot be subscribed to.',
                (string) $plan->getKey(),
            ));
        }

        if ($plan->{PlanInterface::ATTR_IS_DEPRECATED} === true) {
            throw new PlanDeprecatedException(\sprintf(
                'Plan "%s" is deprecated; new subscriptions must pick a currently offered plan.',
                (string) $plan->getKey(),
            ));
        }
    }
}
