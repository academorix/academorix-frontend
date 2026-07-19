<?php

declare(strict_types=1);

namespace Academorix\Subscription\Database\Factories;

use Academorix\Subscription\Contracts\Data\PlanInterface;
use Academorix\Subscription\Enums\BillingCycle;
use Academorix\Subscription\Enums\BillingMode;
use Academorix\Subscription\Enums\PlanTier;
use Academorix\Subscription\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Plan}.
 *
 * Default: a public, non-deprecated, non-system Team plan billed
 * monthly at $29.00 USD. States cover the other three tiers, the
 * archived + deprecated + system states, and the invoice billing
 * mode used by enterprise contracts.
 *
 * @extends Factory<Plan>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class PlanFactory extends Factory
{
    /**
     * @var class-string<Plan>
     */
    protected $model = Plan::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            PlanInterface::ATTR_ID                    => 'pln_' . Str::ulid()->toBase32(),
            PlanInterface::ATTR_APPLICATION_ID        => 'app_' . Str::ulid()->toBase32(),
            PlanInterface::ATTR_KEY                   => 'team_monthly_' . Str::random(6),
            PlanInterface::ATTR_NAME                  => 'Team (monthly)',
            PlanInterface::ATTR_DESCRIPTION           => 'Small-team paid tier billed monthly.',
            PlanInterface::ATTR_TIER                  => PlanTier::Team->value,
            PlanInterface::ATTR_BILLING_CYCLE         => BillingCycle::Monthly->value,
            PlanInterface::ATTR_BILLING_MODE          => BillingMode::Cashier->value,
            PlanInterface::ATTR_PRICE_MICRO_UNITS     => 29_000_000,
            PlanInterface::ATTR_CURRENCY              => 'USD',
            PlanInterface::ATTR_PROVIDER_PRICE_ID     => 'price_' . Str::random(24),
            PlanInterface::ATTR_TRIAL_DAYS            => 14,
            PlanInterface::ATTR_DEFAULT_ENTITLEMENTS  => [
                'branches.max' => ['kind' => 'slot', 'value_cap' => 5],
            ],
            PlanInterface::ATTR_INCLUDED_FEATURES     => ['branches', 'coaches', 'sessions'],
            PlanInterface::ATTR_IS_SYSTEM             => false,
            PlanInterface::ATTR_IS_PUBLIC             => true,
            PlanInterface::ATTR_IS_DEPRECATED         => false,
            PlanInterface::ATTR_SORT_ORDER            => 20,
        ];
    }

    /**
     * Free-tier state.
     */
    public function free(): static
    {
        return $this->state(fn (): array => [
            PlanInterface::ATTR_TIER              => PlanTier::Free->value,
            PlanInterface::ATTR_KEY               => 'free_' . Str::random(6),
            PlanInterface::ATTR_NAME              => 'Free',
            PlanInterface::ATTR_PRICE_MICRO_UNITS => 0,
            PlanInterface::ATTR_TRIAL_DAYS        => 0,
            PlanInterface::ATTR_SORT_ORDER        => 0,
        ]);
    }

    /**
     * Enterprise + invoice billing mode.
     */
    public function enterprise(): static
    {
        return $this->state(fn (): array => [
            PlanInterface::ATTR_TIER              => PlanTier::Enterprise->value,
            PlanInterface::ATTR_KEY               => 'enterprise_' . Str::random(6),
            PlanInterface::ATTR_NAME              => 'Enterprise',
            PlanInterface::ATTR_BILLING_MODE      => BillingMode::Invoice->value,
            PlanInterface::ATTR_PROVIDER_PRICE_ID => null,
            PlanInterface::ATTR_IS_PUBLIC         => false,
            PlanInterface::ATTR_SORT_ORDER        => 30,
        ]);
    }

    /**
     * Deprecated state — grandfathered existing subscriptions.
     */
    public function deprecated(): static
    {
        return $this->state(fn (): array => [
            PlanInterface::ATTR_IS_DEPRECATED => true,
        ]);
    }

    /**
     * Archived state.
     */
    public function archived(): static
    {
        return $this->state(fn (): array => [
            PlanInterface::ATTR_ARCHIVED_AT => \now(),
            PlanInterface::ATTR_IS_PUBLIC   => false,
        ]);
    }

    /**
     * System plan — immutable outside a seed context.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            PlanInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
