<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Database\Factories;

use Stackra\Newsletter\Contracts\Data\NewsletterIssueInterface;
use Stackra\Newsletter\Enums\NewsletterIssueStatus;
use Stackra\Newsletter\Models\NewsletterIssue;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NewsletterIssue}.
 *
 * States:
 *   - `scheduled()` — status = Scheduled + scheduled_at set.
 *   - `sent()`      — status = Sent + sent_at set.
 *   - `cancelled()` — status = Cancelled.
 *
 * @extends Factory<NewsletterIssue>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterIssueFactory extends Factory
{
    /**
     * @var class-string<NewsletterIssue>
     */
    protected $model = NewsletterIssue::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            NewsletterIssueInterface::ATTR_ID              => 'nli_' . Str::ulid()->toBase32(),
            NewsletterIssueInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            NewsletterIssueInterface::ATTR_NEWSLETTER_ID   => 'nlp_' . Str::ulid()->toBase32(),
            NewsletterIssueInterface::ATTR_SLUG            => 'issue-' . $this->faker->unique()->slug(2),
            NewsletterIssueInterface::ATTR_ISSUE_NUMBER    => $this->faker->numberBetween(1, 500),
            NewsletterIssueInterface::ATTR_SUBJECT         => $this->faker->sentence(6),
            NewsletterIssueInterface::ATTR_PREHEADER       => $this->faker->sentence(),
            NewsletterIssueInterface::ATTR_CONTENT_BLOCKS  => [],
            NewsletterIssueInterface::ATTR_VARIABLES       => [],
            NewsletterIssueInterface::ATTR_STATUS          => NewsletterIssueStatus::Draft->value,
            NewsletterIssueInterface::ATTR_SCHEDULED_AT    => null,
            NewsletterIssueInterface::ATTR_SENT_AT         => null,
            NewsletterIssueInterface::ATTR_CANCELLED_AT    => null,
            NewsletterIssueInterface::ATTR_CANCEL_REASON   => null,
            NewsletterIssueInterface::ATTR_METADATA        => null,
        ];
    }

    /**
     * State: status = Scheduled.
     */
    public function scheduled(): static
    {
        return $this->state(fn (): array => [
            NewsletterIssueInterface::ATTR_STATUS       => NewsletterIssueStatus::Scheduled->value,
            NewsletterIssueInterface::ATTR_SCHEDULED_AT => \now()->addHour(),
        ]);
    }

    /**
     * State: status = Sent.
     */
    public function sent(): static
    {
        return $this->state(fn (): array => [
            NewsletterIssueInterface::ATTR_STATUS  => NewsletterIssueStatus::Sent->value,
            NewsletterIssueInterface::ATTR_SENT_AT => \now()->subMinutes(5),
        ]);
    }

    /**
     * State: status = Cancelled.
     */
    public function cancelled(): static
    {
        return $this->state(fn (): array => [
            NewsletterIssueInterface::ATTR_STATUS       => NewsletterIssueStatus::Cancelled->value,
            NewsletterIssueInterface::ATTR_CANCELLED_AT => \now(),
        ]);
    }
}
