<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\StateInterface;
use Academorix\Geography\Models\State;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see State}.
 *
 * @extends Factory<State>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class StateFactory extends Factory
{
    /**
     * @var class-string<State>
     */
    protected $model = State::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            StateInterface::ATTR_COUNTRY_ID   => 1,
            StateInterface::ATTR_NAME         => $this->faker->state(),
            StateInterface::ATTR_COUNTRY_CODE => \strtoupper($this->faker->lexify('??')),
            StateInterface::ATTR_STATE_CODE   => \strtoupper($this->faker->lexify('??-???')),
            StateInterface::ATTR_TYPE         => 'state',
            StateInterface::ATTR_LATITUDE     => (string) $this->faker->latitude(),
            StateInterface::ATTR_LONGITUDE    => (string) $this->faker->longitude(),
        ];
    }
}
