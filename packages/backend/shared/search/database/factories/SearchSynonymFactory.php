<?php

declare(strict_types=1);

namespace Stackra\Search\Database\Factories;

use Stackra\Search\Contracts\Data\SearchSynonymInterface;
use Stackra\Search\Enums\SynonymKind;
use Stackra\Search\Models\SearchSynonym;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see SearchSynonym}.
 *
 * @extends Factory<SearchSynonym>
 *
 * @category Search
 *
 * @since    0.1.0
 */
final class SearchSynonymFactory extends Factory
{
    /**
     * @var class-string<SearchSynonym>
     */
    protected $model = SearchSynonym::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            SearchSynonymInterface::ATTR_LANGUAGE  => 'en',
            SearchSynonymInterface::ATTR_KIND      => SynonymKind::Equivalent->value,
            SearchSynonymInterface::ATTR_TERMS     => [
                $this->faker->word(),
                $this->faker->word(),
                $this->faker->word(),
            ],
            SearchSynonymInterface::ATTR_IS_ACTIVE => true,
            SearchSynonymInterface::ATTR_IS_SYSTEM => false,
            SearchSynonymInterface::ATTR_SOURCE    => 'tenant_admin',
        ];
    }
}
