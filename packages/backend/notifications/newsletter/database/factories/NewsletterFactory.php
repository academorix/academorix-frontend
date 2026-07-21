<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Database\Factories;

use Stackra\Newsletter\Contracts\Data\NewsletterInterface;
use Stackra\Newsletter\Enums\NewsletterCadence;
use Stackra\Newsletter\Enums\NewsletterStatus;
use Stackra\Newsletter\Models\Newsletter;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Newsletter}.
 *
 * States:
 *   - `active()`    — status = Active.
 *   - `archived()`  — status = Archived.
 *   - `throttled()` — status = Throttled.
 *
 * @extends Factory<Newsletter>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterFactory extends Factory
{
    /**
     * @var class-string<Newsletter>
     */
    protected $model = Newsletter::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'newsletter-' . $this->faker->unique()->slug(2);

        return [
            NewsletterInterface::ATTR_ID                     => 'nlp_' . Str::ulid()->toBase32(),
            NewsletterInterface::ATTR_TENANT_ID              => 'ten_' . Str::ulid()->toBase32(),
            NewsletterInterface::ATTR_SLUG                   => $slug,
            NewsletterInterface::ATTR_NAME                   => $this->faker->sentence(3),
            NewsletterInterface::ATTR_DESCRIPTION            => $this->faker->paragraph(),
            NewsletterInterface::ATTR_CADENCE                => NewsletterCadence::Weekly->value,
            NewsletterInterface::ATTR_STATUS                 => NewsletterStatus::Draft->value,
            NewsletterInterface::ATTR_CONFIRMATION_REQUIRED  => true,
            NewsletterInterface::ATTR_SENDER_CONFIG          => null,
            NewsletterInterface::ATTR_BRAND                  => null,
            NewsletterInterface::ATTR_REPUTATION_THRESHOLDS  => null,
            NewsletterInterface::ATTR_REPUTATION_BREACH_STREAK => 0,
            NewsletterInterface::ATTR_LAST_ISSUE_NUMBER      => 0,
            NewsletterInterface::ATTR_METADATA               => null,
        ];
    }

    /**
     * State: status = Active.
     */
    public function active(): static
    {
        return $this->state(fn (): array => [
            NewsletterInterface::ATTR_STATUS => NewsletterStatus::Active->value,
        ]);
    }

    /**
     * State: status = Archived.
     */
    public function archived(): static
    {
        return $this->state(fn (): array => [
            NewsletterInterface::ATTR_STATUS => NewsletterStatus::Archived->value,
        ]);
    }

    /**
     * State: status = Throttled.
     */
    public function throttled(): static
    {
        return $this->state(fn (): array => [
            NewsletterInterface::ATTR_STATUS => NewsletterStatus::Throttled->value,
        ]);
    }
}
