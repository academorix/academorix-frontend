<?php

declare(strict_types=1);

namespace Academorix\Search\Database\Factories;

use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Academorix\Search\Enums\SearchSyncJobStatus;
use Academorix\Search\Models\SearchSyncJob;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see SearchSyncJob}.
 *
 * @extends Factory<SearchSyncJob>
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSyncJobFactory extends Factory
{
    /**
     * @var class-string<SearchSyncJob>
     */
    protected $model = SearchSyncJob::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID => 'sidx_' . $this->faker->unique()->uuid,
            SearchSyncJobInterface::ATTR_KIND            => 'reindex',
            SearchSyncJobInterface::ATTR_STATUS          => SearchSyncJobStatus::Queued->value,
            SearchSyncJobInterface::ATTR_SOURCE          => 'live',
            SearchSyncJobInterface::ATTR_SHARDS_TOTAL    => 0,
            SearchSyncJobInterface::ATTR_SHARDS_COMPLETED => 0,
            SearchSyncJobInterface::ATTR_PROGRESS_PERCENT => 0,
            SearchSyncJobInterface::ATTR_RETENTION_TIER  => 'medium',
        ];
    }
}
