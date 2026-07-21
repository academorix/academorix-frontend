<?php

declare(strict_types=1);

namespace Stackra\Search\Database\Factories;

use Stackra\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Stackra\Search\Enums\AnalyticsEventKind;
use Stackra\Search\Enums\SearchEngine;
use Stackra\Search\Models\SearchAnalyticsEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see SearchAnalyticsEvent}.
 *
 * @extends Factory<SearchAnalyticsEvent>
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchAnalyticsEventFactory extends Factory
{
    /**
     * @var class-string<SearchAnalyticsEvent>
     */
    protected $model = SearchAnalyticsEvent::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $query = $this->faker->words(3, true);

        return [
            SearchAnalyticsEventInterface::ATTR_KIND         => AnalyticsEventKind::Query->value,
            SearchAnalyticsEventInterface::ATTR_ENGINE       => SearchEngine::Meilisearch->value,
            SearchAnalyticsEventInterface::ATTR_INDEX_NAMES  => ['athletes'],
            SearchAnalyticsEventInterface::ATTR_QUERY        => $query,
            SearchAnalyticsEventInterface::ATTR_QUERY_HASH   => \hash('sha256', (string) $query),
            SearchAnalyticsEventInterface::ATTR_RESULT_COUNT => $this->faker->numberBetween(0, 500),
            SearchAnalyticsEventInterface::ATTR_TOOK_MS      => $this->faker->numberBetween(1, 500),
            SearchAnalyticsEventInterface::ATTR_RETENTION_TIER => 'short',
        ];
    }
}
