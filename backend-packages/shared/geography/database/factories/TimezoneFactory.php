<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\TimezoneInterface;
use Academorix\Geography\Models\Timezone;
use DateTimeZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see Timezone}.
 *
 * Draws its `name` from PHP's real IANA identifier list so the
 * observer's validation guard never rejects a factory row.
 *
 * @extends Factory<Timezone>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class TimezoneFactory extends Factory
{
    /**
     * @var class-string<Timezone>
     */
    protected $model = Timezone::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $identifiers = DateTimeZone::listIdentifiers();

        return [
            TimezoneInterface::ATTR_COUNTRY_ID   => 1,
            TimezoneInterface::ATTR_NAME         => $this->faker->randomElement($identifiers),
            TimezoneInterface::ATTR_COUNTRY_CODE => \strtoupper($this->faker->lexify('??')),
        ];
    }
}
