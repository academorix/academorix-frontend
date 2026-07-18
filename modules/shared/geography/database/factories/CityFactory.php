<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\CityInterface;
use Academorix\Geography\Models\City;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see City}.
 *
 * @extends Factory<City>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CityFactory extends Factory
{
    /**
     * @var class-string<City>
     */
    protected $model = City::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            CityInterface::ATTR_COUNTRY_ID   => 1,
            CityInterface::ATTR_STATE_ID     => 1,
            CityInterface::ATTR_NAME         => $this->faker->city(),
            CityInterface::ATTR_COUNTRY_CODE => \strtoupper($this->faker->lexify('??')),
            CityInterface::ATTR_STATE_CODE   => null,
            CityInterface::ATTR_LATITUDE     => (string) $this->faker->latitude(),
            CityInterface::ATTR_LONGITUDE    => (string) $this->faker->longitude(),
        ];
    }
}
