<?php

declare(strict_types=1);

namespace Academorix\Subscription\Data;

use Academorix\Subscription\Contracts\Data\SubscriptionInterface;
use Academorix\Subscription\Enums\BillingCycle;
use Academorix\Subscription\Enums\SubscriptionProvider;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Models\Subscription;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Subscription}.
 *
 * Provider IDs (`provider_subscription_id`, `provider_customer_id`)
 * are omitted from the tenant-audience payload — they are only
 * visible on the platform-admin surface.
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SubscriptionData extends Data
{
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $applicationId,
        public string $planId,
        public SubscriptionProvider $provider,
        public SubscriptionState $state,
        public BillingCycle $billingCycle,
        public bool $cancelAtPeriodEnd,
        public int $consecutiveFailures,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $trialEndsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $currentPeriodStart = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $currentPeriodEnd = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $graceEndsAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $suspendedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $cancelledAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $reinstatedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastPaymentAt = null,
    ) {
    }

    /**
     * Build the DTO from a Subscription model.
     */
    public static function fromModel(Subscription $subscription): self
    {
        $provider = $subscription->{SubscriptionInterface::ATTR_PROVIDER};
        $provider = $provider instanceof SubscriptionProvider
            ? $provider
            : (SubscriptionProvider::tryFrom((string) $provider) ?? SubscriptionProvider::Stripe);

        $state = $subscription->{SubscriptionInterface::ATTR_STATE};
        $state = $state instanceof SubscriptionState
            ? $state
            : (SubscriptionState::tryFrom((string) $state) ?? SubscriptionState::Trialing);

        $cycle = $subscription->{SubscriptionInterface::ATTR_BILLING_CYCLE};
        $cycle = $cycle instanceof BillingCycle
            ? $cycle
            : (BillingCycle::tryFrom((string) $cycle) ?? BillingCycle::Monthly);

        return new self(
            id: (string) $subscription->getKey(),
            tenantId: (string) $subscription->{SubscriptionInterface::ATTR_TENANT_ID},
            applicationId: (string) $subscription->{SubscriptionInterface::ATTR_APPLICATION_ID},
            planId: (string) $subscription->{SubscriptionInterface::ATTR_PLAN_ID},
            provider: $provider,
            state: $state,
            billingCycle: $cycle,
            cancelAtPeriodEnd: (bool) $subscription->{SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END},
            consecutiveFailures: (int) $subscription->{SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES},
            createdAt: $subscription->{SubscriptionInterface::ATTR_CREATED_AT},
            updatedAt: $subscription->{SubscriptionInterface::ATTR_UPDATED_AT},
            trialEndsAt: $subscription->{SubscriptionInterface::ATTR_TRIAL_ENDS_AT},
            currentPeriodStart: $subscription->{SubscriptionInterface::ATTR_CURRENT_PERIOD_START},
            currentPeriodEnd: $subscription->{SubscriptionInterface::ATTR_CURRENT_PERIOD_END},
            graceEndsAt: $subscription->{SubscriptionInterface::ATTR_GRACE_ENDS_AT},
            suspendedAt: $subscription->{SubscriptionInterface::ATTR_SUSPENDED_AT},
            cancelledAt: $subscription->{SubscriptionInterface::ATTR_CANCELLED_AT},
            reinstatedAt: $subscription->{SubscriptionInterface::ATTR_REINSTATED_AT},
            lastPaymentAt: $subscription->{SubscriptionInterface::ATTR_LAST_PAYMENT_AT},
        );
    }
}
