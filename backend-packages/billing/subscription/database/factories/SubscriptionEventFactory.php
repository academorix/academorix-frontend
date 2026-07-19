<?php

declare(strict_types=1);

namespace Academorix\Subscription\Database\Factories;

use Academorix\Subscription\Contracts\Data\SubscriptionEventInterface;
use Academorix\Subscription\Enums\SubscriptionEventActor;
use Academorix\Subscription\Enums\SubscriptionEventKind;
use Academorix\Subscription\Enums\SubscriptionState;
use Academorix\Subscription\Models\SubscriptionEvent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SubscriptionEvent}.
 *
 * Default: a `Started` event with `actor_type=system`. States cover
 * the state transitions (activated / upgraded / cancelled / etc)
 * and the provider webhook path.
 *
 * @extends Factory<SubscriptionEvent>
 *
 * @category Subscription
 *
 * @since    0.1.0
 */
final class SubscriptionEventFactory extends Factory
{
    /**
     * @var class-string<SubscriptionEvent>
     */
    protected $model = SubscriptionEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SubscriptionEventInterface::ATTR_ID              => 'sev_' . Str::ulid()->toBase32(),
            SubscriptionEventInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            SubscriptionEventInterface::ATTR_SUBSCRIPTION_ID => 'sub_' . Str::ulid()->toBase32(),
            SubscriptionEventInterface::ATTR_KIND            => SubscriptionEventKind::Started->value,
            SubscriptionEventInterface::ATTR_TO_STATE        => SubscriptionState::Trialing->value,
            SubscriptionEventInterface::ATTR_OCCURRED_AT     => \now(),
            SubscriptionEventInterface::ATTR_ACTOR_TYPE      => SubscriptionEventActor::System->value,
        ];
    }

    /**
     * Provider-webhook variant — carries `provider_event_id`.
     */
    public function providerWebhook(): static
    {
        return $this->state(fn (): array => [
            SubscriptionEventInterface::ATTR_ACTOR_TYPE        => SubscriptionEventActor::ProviderWebhook->value,
            SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID => 'evt_' . Str::random(24),
        ]);
    }

    /**
     * Upgraded transition — plan swap to higher tier.
     */
    public function upgraded(): static
    {
        return $this->state(fn (): array => [
            SubscriptionEventInterface::ATTR_KIND         => SubscriptionEventKind::Upgraded->value,
            SubscriptionEventInterface::ATTR_FROM_PLAN_ID => 'pln_' . Str::ulid()->toBase32(),
            SubscriptionEventInterface::ATTR_TO_PLAN_ID   => 'pln_' . Str::ulid()->toBase32(),
        ]);
    }

    /**
     * Payment-succeeded — carries amount + currency.
     */
    public function paymentSucceeded(): static
    {
        return $this->state(fn (): array => [
            SubscriptionEventInterface::ATTR_KIND               => SubscriptionEventKind::PaymentSucceeded->value,
            SubscriptionEventInterface::ATTR_AMOUNT_MICRO_UNITS => 29_000_000,
            SubscriptionEventInterface::ATTR_CURRENCY           => 'USD',
            SubscriptionEventInterface::ATTR_ACTOR_TYPE         => SubscriptionEventActor::ProviderWebhook->value,
            SubscriptionEventInterface::ATTR_PROVIDER_EVENT_ID  => 'evt_' . Str::random(24),
        ]);
    }
}
