<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Database\Factories;

use Stackra\Newsletter\Contracts\Data\NewsletterAudienceInterface;
use Stackra\Newsletter\Models\NewsletterAudience;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see NewsletterAudience}.
 *
 * States:
 *   - `default()` — is_default = true; matches every active
 *     subscription regardless of `expression`.
 *
 * @extends Factory<NewsletterAudience>
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
final class NewsletterAudienceFactory extends Factory
{
    /**
     * @var class-string<NewsletterAudience>
     */
    protected $model = NewsletterAudience::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'segment-' . $this->faker->unique()->slug(2);

        return [
            NewsletterAudienceInterface::ATTR_ID                      => 'nla_' . Str::ulid()->toBase32(),
            NewsletterAudienceInterface::ATTR_TENANT_ID               => 'ten_' . Str::ulid()->toBase32(),
            NewsletterAudienceInterface::ATTR_NEWSLETTER_ID           => 'nlp_' . Str::ulid()->toBase32(),
            NewsletterAudienceInterface::ATTR_SLUG                    => $slug,
            NewsletterAudienceInterface::ATTR_NAME                    => $this->faker->words(2, true),
            NewsletterAudienceInterface::ATTR_DESCRIPTION             => $this->faker->sentence(),
            NewsletterAudienceInterface::ATTR_EXPRESSION              => ['all' => [], 'any' => [], 'none' => []],
            NewsletterAudienceInterface::ATTR_IS_DEFAULT              => false,
            NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_IDS   => [],
            NewsletterAudienceInterface::ATTR_CACHED_SUBSCRIBER_COUNT => 0,
            NewsletterAudienceInterface::ATTR_CACHE_REFRESHED_AT      => null,
            NewsletterAudienceInterface::ATTR_METADATA                => null,
        ];
    }

    /**
     * State: is_default = true.
     */
    public function default(): static
    {
        return $this->state(fn (): array => [
            NewsletterAudienceInterface::ATTR_SLUG       => 'all-subscribers',
            NewsletterAudienceInterface::ATTR_NAME       => 'All Subscribers',
            NewsletterAudienceInterface::ATTR_IS_DEFAULT => true,
        ]);
    }
}
