<?php

declare(strict_types=1);

namespace Academorix\Webhook\Database\Factories;

use Academorix\Webhook\Contracts\Data\WebhookSubscriptionInterface;
use Academorix\Webhook\Enums\WebhookSubscriptionStatus;
use Academorix\Webhook\Models\WebhookSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see WebhookSubscription}.
 *
 * @extends Factory<WebhookSubscription>
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class WebhookSubscriptionFactory extends Factory
{
    /**
     * @var class-string<WebhookSubscription>
     */
    protected $model = WebhookSubscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            WebhookSubscriptionInterface::ATTR_ID                        => 'whs_' . Str::ulid()->toBase32(),
            WebhookSubscriptionInterface::ATTR_TENANT_ID                 => 'ten_' . Str::ulid()->toBase32(),
            WebhookSubscriptionInterface::ATTR_NAME                      => 'Test Subscription',
            WebhookSubscriptionInterface::ATTR_DESTINATION               => 'https',
            WebhookSubscriptionInterface::ATTR_DESTINATION_CONFIG        => ['url' => 'https://example.com/webhook'],
            WebhookSubscriptionInterface::ATTR_EVENTS                    => ['tenant.created'],
            WebhookSubscriptionInterface::ATTR_SIGNING_SECRET            => \bin2hex(\random_bytes(32)),
            WebhookSubscriptionInterface::ATTR_STATUS                    => WebhookSubscriptionStatus::Active->value,
            WebhookSubscriptionInterface::ATTR_CONSECUTIVE_FAILURES      => 0,
            WebhookSubscriptionInterface::ATTR_RATE_LIMIT_PER_MINUTE     => 60,
            WebhookSubscriptionInterface::ATTR_BACKOFF_STRATEGY          => 'static',
        ];
    }

    public function paused(): static
    {
        return $this->state(fn (): array => [
            WebhookSubscriptionInterface::ATTR_STATUS => WebhookSubscriptionStatus::Paused->value,
        ]);
    }

    public function disabled(): static
    {
        return $this->state(fn (): array => [
            WebhookSubscriptionInterface::ATTR_STATUS          => WebhookSubscriptionStatus::Disabled->value,
            WebhookSubscriptionInterface::ATTR_DISABLED_AT     => \now(),
            WebhookSubscriptionInterface::ATTR_DISABLED_REASON => 'failure_threshold',
        ]);
    }

    public function withDestination(string $key): static
    {
        return $this->state(fn (): array => [
            WebhookSubscriptionInterface::ATTR_DESTINATION => $key,
        ]);
    }

    /**
     * @param  list<string>  $events
     */
    public function withEvents(array $events): static
    {
        return $this->state(fn (): array => [
            WebhookSubscriptionInterface::ATTR_EVENTS => $events,
        ]);
    }
}
