<?php

declare(strict_types=1);

namespace Stackra\Search\Database\Factories;

use Stackra\Search\Contracts\Data\SearchIndexInterface;
use Stackra\Search\Enums\SearchEngine;
use Stackra\Search\Enums\SearchIndexStatus;
use Stackra\Search\Models\SearchIndex;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see SearchIndex}.
 *
 * @extends Factory<SearchIndex>
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchIndexFactory extends Factory
{
    /**
     * @var class-string<SearchIndex>
     */
    protected $model = SearchIndex::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $modelClass = 'App\\Models\\' . $this->faker->unique()->words(2, true);
        $indexName  = \strtolower(\str_replace(['\\', ' '], ['_', '_'], $modelClass));

        return [
            SearchIndexInterface::ATTR_MODEL_CLASS     => $modelClass,
            SearchIndexInterface::ATTR_ENGINE          => SearchEngine::Meilisearch->value,
            SearchIndexInterface::ATTR_INDEX_NAME      => $indexName,
            SearchIndexInterface::ATTR_LIVE_ALIAS      => $indexName . '_live',
            SearchIndexInterface::ATTR_CURRENT_VERSION => 1,
            SearchIndexInterface::ATTR_STATUS          => SearchIndexStatus::Live->value,
            SearchIndexInterface::ATTR_LANGUAGE        => 'en',
            SearchIndexInterface::ATTR_DOCUMENT_COUNT  => 0,
            SearchIndexInterface::ATTR_RETENTION_TIER  => 'medium',
        ];
    }
}
