<?php

declare(strict_types=1);

namespace Stackra\Subscription\Observers;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Enums\PlanTier;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Events\SubscriptionActivated;
use Stackra\Subscription\Events\SubscriptionCancelled;
use Stackra\Subscription\Events\SubscriptionDowngraded;
use Stackra\Subscription\Events\SubscriptionPastDue;
use Stackra\Subscription\Events\SubscriptionStarted;
use Stackra\Subscription\Events\SubscriptionSuspended;
use Stackra\Subscription\Events\SubscriptionSwitched;
use Stackra\Subscription\Events\SubscriptionUnpaid;
use Stackra\Subscription\Events\SubscriptionUpgraded;
use Stackra\Subscription\Events\TrialEnded;
use Stackra\Subscription\Models\Plan;
use Stackra\Subscription\Models\Subscription;

/**
 * Lifecycle side effects on {@see Subscription}.
 *
 * ## Responsibilities
 *
 *   - `updating`  — snapshot pre-update state so `updated` can
 *     compare `from → to` and fire the matching state / plan event.
 *   - `created`   — fire `SubscriptionStarted`.
 *   - `updated`   — decode state transition + plan swap + trial
 *     boundary, fire matching events.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionObserver
{
    /**
     * Per-instance memo of the pre-update state + plan_id + trial
     * boundary. Populated in `updating`, consumed in `updated`.
     *
     * @var array<string, array{state: string|null, plan_id: string|null, trial_ends_at: string|null}>
     */
    private array $priorSnapshot = [];

    /**
     * `updating` — snapshot pre-update state.
     */
    public function updating(Subscription $subscription): void
    {
        $original = $subscription->getOriginal();

        /** @var mixed $rawState */
        $rawState = $original[SubscriptionInterface::ATTR_STATE] ?? null;
        /** @var mixed $rawPlanId */
        $rawPlanId = $original[SubscriptionInterface::ATTR_PLAN_ID] ?? null;
        /** @var mixed $rawTrialEndsAt */
        $rawTrialEndsAt = $original[SubscriptionInterface::ATTR_TRIAL_ENDS_AT] ?? null;

        $this->priorSnapshot[(string) $subscription->getKey()] = [
            'state'         => $rawState === null ? null : (string) $rawState,
            'plan_id'       => $rawPlanId === null ? null : (string) $rawPlanId,
            'trial_ends_at' => $rawTrialEndsAt === null ? null : (string) $rawTrialEndsAt,
        ];
    }

    /**
     * `created` — fire `SubscriptionStarted`.
     */
    public function created(Subscription $subscription): void
    {
        SubscriptionStarted::dispatch($subscription);
    }

    /**
     * `updated` — decode the transitions and fire matching events.
     */
    public function updated(Subscription $subscription): void
    {
        $key = (string) $subscription->getKey();
        if (! isset($this->priorSnapshot[$key])) {
            return;
        }

        $prior = $this->priorSnapshot[$key];
        unset($this->priorSnapshot[$key]);

        $newStateValue = $this->stateValue($subscription);
        $priorStateValue = $prior['state'];

        // State transitions — fire the matching event per to-state.
        if ($priorStateValue !== null && $priorStateValue !== $newStateValue) {
            $this->fireStateEvent($subscription, $priorStateValue, $newStateValue);
        }

        // Plan swap — decide upgrade vs downgrade vs switch by tier
        // rank on both plans. Only fire when the FK actually changed.
        $newPlanId = (string) $subscription->{SubscriptionInterface::ATTR_PLAN_ID};
        if ($prior['plan_id'] !== null && $prior['plan_id'] !== $newPlanId) {
            $this->firePlanSwapEvent($subscription, $prior['plan_id'], $newPlanId);
        }

        // Trial boundary crossed — fire TrialEnded when the state is
        // no longer trialing but trial_ends_at was in the past.
        if ($priorStateValue === SubscriptionState::Trialing->value
            && $newStateValue !== SubscriptionState::Trialing->value
        ) {
            TrialEnded::dispatch(
                $subscription,
                $newStateValue === SubscriptionState::Active->value,
            );
        }
    }

    /**
     * Normalise a subscription's state to its scalar backing value.
     */
    private function stateValue(Subscription $subscription): string
    {
        $state = $subscription->{SubscriptionInterface::ATTR_STATE};

        return $state instanceof SubscriptionState ? $state->value : (string) $state;
    }

    /**
     * Fire the event that matches the to-state.
     */
    private function fireStateEvent(Subscription $subscription, string $from, string $to): void
    {
        match ($to) {
            SubscriptionState::Active->value    => SubscriptionActivated::dispatch($subscription, $from),
            SubscriptionState::AtRisk->value,
            SubscriptionState::PastDue->value   => SubscriptionPastDue::dispatch(
                $subscription,
                $subscription->{SubscriptionInterface::ATTR_GRACE_ENDS_AT},
            ),
            SubscriptionState::Grace->value,
            SubscriptionState::Unpaid->value    => SubscriptionUnpaid::dispatch(
                $subscription,
                (int) $subscription->{SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES},
            ),
            SubscriptionState::Suspended->value => SubscriptionSuspended::dispatch($subscription),
            SubscriptionState::Cancelled->value => SubscriptionCancelled::dispatch(
                $subscription,
                (bool) $subscription->{SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END},
                null,
                null,
            ),
            default                             => null,
        };
    }

    /**
     * Fire upgrade / downgrade / switch by comparing tier ranks.
     */
    private function firePlanSwapEvent(Subscription $subscription, string $fromPlanId, string $toPlanId): void
    {
        // Cheap: resolve the two plans via the model's plan()
        // relationship and by explicit find. The plans repository
        // could be used here but the observer is not injected with
        // it — observers stay dependency-light so they can run inside
        // seeders + tests without wiring.
        $toPlan = Plan::query()->find($toPlanId);
        $fromPlan = Plan::query()->find($fromPlanId);

        if ($toPlan === null || $fromPlan === null) {
            // Fall back to a switch when either plan cannot be
            // resolved — better to record something than nothing.
            SubscriptionSwitched::dispatch($subscription, $fromPlanId, $toPlanId);

            return;
        }

        $fromTier = $fromPlan->{\Stackra\Subscription\Contracts\Data\PlanInterface::ATTR_TIER};
        $toTier = $toPlan->{\Stackra\Subscription\Contracts\Data\PlanInterface::ATTR_TIER};

        $fromRank = $fromTier instanceof PlanTier ? $fromTier->rank() : (PlanTier::tryFrom((string) $fromTier)?->rank() ?? 0);
        $toRank   = $toTier   instanceof PlanTier ? $toTier->rank()   : (PlanTier::tryFrom((string) $toTier)?->rank() ?? 0);

        if ($toRank > $fromRank) {
            SubscriptionUpgraded::dispatch($subscription, $fromPlanId, $toPlanId);
        } elseif ($toRank < $fromRank) {
            SubscriptionDowngraded::dispatch($subscription, $fromPlanId, $toPlanId);
        } else {
            SubscriptionSwitched::dispatch($subscription, $fromPlanId, $toPlanId);
        }
    }
}
