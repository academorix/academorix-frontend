<?php

declare(strict_types=1);

namespace Stackra\Subscription\Database\Factories;

use Stackra\Subscription\Contracts\Data\SubscriptionInterface;
use Stackra\Subscription\Enums\BillingCycle;
use Stackra\Subscription\Enums\SubscriptionProvider;
use Stackra\Subscription\Enums\SubscriptionState;
use Stackra\Subscription\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Subscription}.
 *
 * Default: trialing Stripe subscription with a 14-day trial window
 * and monthly billing. States cover the other lifecycle states +
 * cancel-at-period-end + invoice provider variant.
 *
 * @extends Factory<Subscription>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionFactory extends Factory
{
    /**
     * @var class-string<Subscription>
     */
    protected $model = Subscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SubscriptionInterface::ATTR_ID                       => 'sub_' . Str::ulid()->toBase32(),
            SubscriptionInterface::ATTR_TENANT_ID                => 'ten_' . Str::ulid()->toBase32(),
            SubscriptionInterface::ATTR_APPLICATION_ID           => 'app_' . Str::ulid()->toBase32(),
            SubscriptionInterface::ATTR_PLAN_ID                  => 'pln_' . Str::ulid()->toBase32(),
            SubscriptionInterface::ATTR_PROVIDER                 => SubscriptionProvider::Stripe->value,
            SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID => 'sub_' . Str::random(24),
            SubscriptionInterface::ATTR_PROVIDER_CUSTOMER_ID     => 'cus_' . Str::random(24),
            SubscriptionInterface::ATTR_STATE                    => SubscriptionState::Trialing->value,
            SubscriptionInterface::ATTR_BILLING_CYCLE            => BillingCycle::Monthly->value,
            SubscriptionInterface::ATTR_TRIAL_ENDS_AT            => \now()->addDays(14),
            SubscriptionInterface::ATTR_CURRENT_PERIOD_START     => \now(),
            SubscriptionInterface::ATTR_CURRENT_PERIOD_END       => \now()->addMonth(),
            SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END     => false,
            SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES     => 0,
        ];
    }

    /**
     * Active state — trial converted, paying + healthy.
     */
    public function active(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE         => SubscriptionState::Active->value,
            SubscriptionInterface::ATTR_TRIAL_ENDS_AT => null,
            SubscriptionInterface::ATTR_LAST_PAYMENT_AT => \now()->subDays(2),
        ]);
    }

    /**
     * At-risk state — first payment failure.
     */
    public function atRisk(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE                 => SubscriptionState::AtRisk->value,
            SubscriptionInterface::ATTR_LAST_PAYMENT_FAILED_AT => \now()->subDay(),
            SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES  => 1,
            SubscriptionInterface::ATTR_GRACE_ENDS_AT         => \now()->addDays(7),
        ]);
    }

    /**
     * Grace state — extended past provider default.
     */
    public function grace(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE                => SubscriptionState::Grace->value,
            SubscriptionInterface::ATTR_CONSECUTIVE_FAILURES => 2,
            SubscriptionInterface::ATTR_GRACE_ENDS_AT        => \now()->addDays(7),
        ]);
    }

    /**
     * Suspended state.
     */
    public function suspended(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE         => SubscriptionState::Suspended->value,
            SubscriptionInterface::ATTR_SUSPENDED_AT  => \now()->subDay(),
        ]);
    }

    /**
     * Cancelled state — terminal.
     */
    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE          => SubscriptionState::Cancelled->value,
            SubscriptionInterface::ATTR_CANCELLED_AT   => \now()->subDay(),
        ]);
    }

    /**
     * Cancel-at-period-end — active until boundary, then cancels.
     */
    public function cancelAtPeriodEnd(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_STATE                 => SubscriptionState::Active->value,
            SubscriptionInterface::ATTR_CANCEL_AT_PERIOD_END  => true,
        ]);
    }

    /**
     * Invoice provider variant — offline PO billing, no Cashier.
     */
    public function invoice(): static
    {
        return $this->state(fn (): array => [
            SubscriptionInterface::ATTR_PROVIDER                 => SubscriptionProvider::Invoice->value,
            SubscriptionInterface::ATTR_PROVIDER_SUBSCRIPTION_ID => null,
            SubscriptionInterface::ATTR_PROVIDER_CUSTOMER_ID     => null,
        ]);
    }
}
