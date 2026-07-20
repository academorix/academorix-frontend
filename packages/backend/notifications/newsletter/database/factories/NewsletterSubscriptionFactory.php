<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Database\Factories;

use Academorix\Newsletter\Contracts\Data\NewsletterSubscriptionInterface;
use Academorix\Newsletter\Enums\NewsletterSubscriptionStatus;
use Academorix\Newsletter\Models\NewsletterSubscription;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NewsletterSubscription}.
 *
 * States:
 *   - `pending()`      — pending confirmation.
 *   - `active()`       — confirmed / receiving campaigns.
 *   - `unsubscribed()` — user unsubscribed.
 *   - `bounced()`      — hard-bounced.
 *
 * @extends Factory<NewsletterSubscription>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterSubscriptionFactory extends Factory
{
    /**
     * @var class-string<NewsletterSubscription>
     */
    protected $model = NewsletterSubscription::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NewsletterSubscriptionInterface::ATTR_ID                  => 'nls_' . Str::ulid()->toBase32(),
            NewsletterSubscriptionInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            NewsletterSubscriptionInterface::ATTR_NEWSLETTER_ID       => 'nlp_' . Str::ulid()->toBase32(),
            NewsletterSubscriptionInterface::ATTR_USER_ID             => null,
            NewsletterSubscriptionInterface::ATTR_EMAIL               => \strtolower($this->faker->unique()->safeEmail()),
            NewsletterSubscriptionInterface::ATTR_FIRST_NAME          => $this->faker->firstName(),
            NewsletterSubscriptionInterface::ATTR_LAST_NAME           => $this->faker->lastName(),
            NewsletterSubscriptionInterface::ATTR_LOCALE              => 'en',
            NewsletterSubscriptionInterface::ATTR_STATUS              => NewsletterSubscriptionStatus::PendingConfirmation->value,
            NewsletterSubscriptionInterface::ATTR_SOURCE              => 'public',
            NewsletterSubscriptionInterface::ATTR_TAGS                => [],
            NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN  => Str::random(48),
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_TOKEN   => Str::random(48),
            NewsletterSubscriptionInterface::ATTR_CONFIRMATION_EXPIRES_AT => \now()->addDays(30),
            NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT        => null,
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT     => null,
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON  => null,
            NewsletterSubscriptionInterface::ATTR_BOUNCE_KIND         => null,
            NewsletterSubscriptionInterface::ATTR_BOUNCED_AT          => null,
            NewsletterSubscriptionInterface::ATTR_COMPLAINED_AT       => null,
            NewsletterSubscriptionInterface::ATTR_CONSENT_EVIDENCE    => [
                'form_url'            => 'https://example.test/subscribe',
                'consent_text_hash'   => \hash('sha256', 'default consent text'),
                'captured_at'         => \now()->toIso8601String(),
            ],
            NewsletterSubscriptionInterface::ATTR_IP_ADDRESS          => '203.0.113.0',
            NewsletterSubscriptionInterface::ATTR_USER_AGENT          => 'Mozilla/5.0 (test)',
            NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT       => null,
            NewsletterSubscriptionInterface::ATTR_LAST_OPENED_AT      => null,
            NewsletterSubscriptionInterface::ATTR_LAST_CLICKED_AT     => null,
            NewsletterSubscriptionInterface::ATTR_ENGAGEMENT_SCORE    => 0,
            NewsletterSubscriptionInterface::ATTR_METADATA            => null,
        ];
    }

    /**
     * State: pending confirmation.
     */
    public function pending(): static
    {
        return $this->state(fn (): array => [
            NewsletterSubscriptionInterface::ATTR_STATUS => NewsletterSubscriptionStatus::PendingConfirmation->value,
        ]);
    }

    /**
     * State: active + confirmed.
     */
    public function active(): static
    {
        return $this->state(fn (): array => [
            NewsletterSubscriptionInterface::ATTR_STATUS             => NewsletterSubscriptionStatus::Active->value,
            NewsletterSubscriptionInterface::ATTR_CONFIRMED_AT       => \now()->subDay(),
            NewsletterSubscriptionInterface::ATTR_SUBSCRIBED_AT      => \now()->subDay(),
            NewsletterSubscriptionInterface::ATTR_CONFIRMATION_TOKEN => null,
        ]);
    }

    /**
     * State: unsubscribed.
     */
    public function unsubscribed(): static
    {
        return $this->state(fn (): array => [
            NewsletterSubscriptionInterface::ATTR_STATUS             => NewsletterSubscriptionStatus::Unsubscribed->value,
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBED_AT    => \now(),
            NewsletterSubscriptionInterface::ATTR_UNSUBSCRIBE_REASON => 'user_action',
        ]);
    }

    /**
     * State: bounced.
     */
    public function bounced(): static
    {
        return $this->state(fn (): array => [
            NewsletterSubscriptionInterface::ATTR_STATUS       => NewsletterSubscriptionStatus::Bounced->value,
            NewsletterSubscriptionInterface::ATTR_BOUNCE_KIND  => 'hard',
            NewsletterSubscriptionInterface::ATTR_BOUNCED_AT   => \now(),
        ]);
    }
}
