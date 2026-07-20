<?php

declare(strict_types=1);

namespace Academorix\Subscription\Contracts\Services;

use Academorix\Subscription\Models\Plan;
use Academorix\Subscription\Models\Subscription;
use Academorix\Subscription\Services\DefaultBillingService;
use Illuminate\Container\Attributes\Bind;

/**
 * High-level orchestrator over the checkout / swap / cancel / resume
 * flows. Sits between actions and the {@see CashierAdapterInterface},
 * folding in our own state transitions + event dispatch.
 *
 * Under the hood the service delegates to Cashier for the provider
 * round-trip and to the {@see SubscriptionRepositoryInterface} for
 * our own state persistence.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[Bind(DefaultBillingService::class)]
interface BillingServiceInterface
{
    /**
     * Build a checkout session URL for the tenant + selected plan.
     * Returns null when the plan's billing mode is `invoice` (no
     * Cashier round-trip).
     *
     * @param  string  $tenantId  Owning tenant.
     * @param  Plan    $plan      Plan the tenant is subscribing to.
     */
    public function startCheckout(string $tenantId, Plan $plan): ?string;

    /**
     * Swap an active subscription onto a new plan. Fires the matching
     * upgrade / downgrade / switch event. Whether the swap is instant
     * or deferred to period end depends on the `subscription.swap`
     * config.
     *
     * @param  Subscription  $subscription  Active subscription to modify.
     * @param  Plan          $newPlan       Target plan.
     */
    public function swapPlan(Subscription $subscription, Plan $newPlan): Subscription;

    /**
     * Cancel a subscription. `atPeriodEnd=true` defers the cancel to
     * the period boundary; `false` cancels immediately.
     *
     * @param  Subscription  $subscription   Subscription to cancel.
     * @param  bool          $atPeriodEnd    Deferred vs immediate.
     * @param  string|null   $reason         Optional operator note.
     */
    public function cancel(Subscription $subscription, bool $atPeriodEnd = true, ?string $reason = null): Subscription;

    /**
     * Reinstate a subscription that has `cancel_at_period_end=true`
     * but has not yet reached the period boundary.
     *
     * @param  Subscription  $subscription  Subscription to reinstate.
     */
    public function reinstate(Subscription $subscription): Subscription;
}
