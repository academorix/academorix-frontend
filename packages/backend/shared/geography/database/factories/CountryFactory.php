<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\CountryInterface;
use Academorix\Geography\Models\Country;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see Country}.
 *
 * Produces a plausible ISO-3166 row for tests. The vendor seeder is
 * the source of truth in production; this factory is for isolated
 * unit tests where the whole vendor seed would be too heavy.
 *
 * @extends Factory<Country>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CountryFactory extends Factory
{
    /**
     * @var class-string<Country>
     */
    protected $model = Country::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            CountryInterface::ATTR_ISO2       => \strtoupper($this->faker->unique()->lexify('??')),
            CountryInterface::ATTR_ISO3       => \strtoupper($this->faker->unique()->lexify('???')),
            CountryInterface::ATTR_NAME       => $this->faker->country(),
            CountryInterface::ATTR_NATIVE     => null,
            CountryInterface::ATTR_PHONE_CODE => (string) $this->faker->numberBetween(1, 999),
            CountryInterface::ATTR_REGION     => $this->faker->randomElement(['Americas', 'Europe', 'Africa', 'Asia', 'Oceania']),
            CountryInterface::ATTR_SUBREGION  => null,
            CountryInterface::ATTR_LATITUDE   => (string) $this->faker->latitude(),
            CountryInterface::ATTR_LONGITUDE  => (string) $this->faker->longitude(),
            CountryInterface::ATTR_EMOJI      => null,
            CountryInterface::ATTR_EMOJI_U    => null,
            CountryInterface::ATTR_STATUS     => 1,
        ];
    }
}
