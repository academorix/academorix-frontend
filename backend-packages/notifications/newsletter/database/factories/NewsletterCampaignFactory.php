<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Database\Factories;

use Academorix\Newsletter\Contracts\Data\NewsletterCampaignInterface;
use Academorix\Newsletter\Enums\NewsletterCampaignStatus;
use Academorix\Newsletter\Models\NewsletterCampaign;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NewsletterCampaign}.
 *
 * States:
 *   - `inProgress()` — status = InProgress + started_at set.
 *   - `completed()`  — status = Completed + counters populated.
 *   - `failed()`     — status = Failed + failure_reason set.
 *
 * @extends Factory<NewsletterCampaign>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterCampaignFactory extends Factory
{
    /**
     * @var class-string<NewsletterCampaign>
     */
    protected $model = NewsletterCampaign::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NewsletterCampaignInterface::ATTR_ID                  => 'nlc_' . Str::ulid()->toBase32(),
            NewsletterCampaignInterface::ATTR_TENANT_ID           => 'ten_' . Str::ulid()->toBase32(),
            NewsletterCampaignInterface::ATTR_NEWSLETTER_ID       => 'nlp_' . Str::ulid()->toBase32(),
            NewsletterCampaignInterface::ATTR_ISSUE_ID            => 'nli_' . Str::ulid()->toBase32(),
            NewsletterCampaignInterface::ATTR_AUDIENCE_ID         => 'nla_' . Str::ulid()->toBase32(),
            NewsletterCampaignInterface::ATTR_STATUS              => NewsletterCampaignStatus::Pending->value,
            NewsletterCampaignInterface::ATTR_SCHEDULED_AT        => \now()->addHour(),
            NewsletterCampaignInterface::ATTR_STARTED_AT          => null,
            NewsletterCampaignInterface::ATTR_COMPLETED_AT        => null,
            NewsletterCampaignInterface::ATTR_CANCELLED_AT        => null,
            NewsletterCampaignInterface::ATTR_FAILURE_REASON      => null,
            NewsletterCampaignInterface::ATTR_SEND_BATCH_SIZE     => 500,
            NewsletterCampaignInterface::ATTR_THROTTLE_PER_SECOND => null,
            NewsletterCampaignInterface::ATTR_COUNTERS            => [
                'targeted'     => 0,
                'sent'         => 0,
                'opened'       => 0,
                'clicked'      => 0,
                'bounced'      => 0,
                'complained'   => 0,
                'unsubscribed' => 0,
                'suppressed'   => 0,
                'opted_out'    => 0,
            ],
            NewsletterCampaignInterface::ATTR_METADATA            => null,
        ];
    }

    /**
     * State: status = InProgress.
     */
    public function inProgress(): static
    {
        return $this->state(fn (): array => [
            NewsletterCampaignInterface::ATTR_STATUS     => NewsletterCampaignStatus::InProgress->value,
            NewsletterCampaignInterface::ATTR_STARTED_AT => \now(),
        ]);
    }

    /**
     * State: status = Completed with populated counters.
     */
    public function completed(): static
    {
        return $this->state(fn (): array => [
            NewsletterCampaignInterface::ATTR_STATUS       => NewsletterCampaignStatus::Completed->value,
            NewsletterCampaignInterface::ATTR_STARTED_AT   => \now()->subMinutes(10),
            NewsletterCampaignInterface::ATTR_COMPLETED_AT => \now(),
            NewsletterCampaignInterface::ATTR_COUNTERS     => [
                'targeted'     => 1000,
                'sent'         => 985,
                'opened'       => 240,
                'clicked'      => 40,
                'bounced'      => 5,
                'complained'   => 1,
                'unsubscribed' => 3,
                'suppressed'   => 10,
                'opted_out'    => 0,
            ],
        ]);
    }

    /**
     * State: status = Failed.
     */
    public function failed(): static
    {
        return $this->state(fn (): array => [
            NewsletterCampaignInterface::ATTR_STATUS         => NewsletterCampaignStatus::Failed->value,
            NewsletterCampaignInterface::ATTR_FAILURE_REASON => 'provider_unavailable',
        ]);
    }
}
