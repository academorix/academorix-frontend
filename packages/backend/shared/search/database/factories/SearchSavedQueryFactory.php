<?php

declare(strict_types=1);

namespace Academorix\Search\Database\Factories;

use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Models\SearchSavedQuery;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see SearchSavedQuery}.
 *
 * @extends Factory<SearchSavedQuery>
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSavedQueryFactory extends Factory
{
    /**
     * @var class-string<SearchSavedQuery>
     */
    protected $model = SearchSavedQuery::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SearchSavedQueryInterface::ATTR_TENANT_ID     => 'ten_' . $this->faker->unique()->uuid,
            SearchSavedQueryInterface::ATTR_OWNER_ID      => 'usr_' . $this->faker->unique()->uuid,
            SearchSavedQueryInterface::ATTR_NAME          => $this->faker->sentence(3),
            SearchSavedQueryInterface::ATTR_ACROSS        => ['App\\Models\\Athlete'],
            SearchSavedQueryInterface::ATTR_QUERY         => $this->faker->words(3, true),
            SearchSavedQueryInterface::ATTR_IS_SHARED     => false,
            SearchSavedQueryInterface::ATTR_IS_SMART_LIST => false,
            SearchSavedQueryInterface::ATTR_USE_COUNT     => 0,
        ];
    }
}
