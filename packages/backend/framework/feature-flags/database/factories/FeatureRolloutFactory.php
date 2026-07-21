<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Database\Factories;

use Stackra\FeatureFlags\Contracts\Data\FeatureRolloutInterface;
use Stackra\FeatureFlags\Models\FeatureRollout;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see FeatureRollout}.
 *
 * Produces rows at `scope_level = tenant` with a 50% rollout by
 * default. No `starts_at` / `ends_at` — always in the active
 * window unless a state overrides.
 *
 * @extends Factory<FeatureRollout>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureRolloutFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<FeatureRollout>
     */
    protected $model = FeatureRollout::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            FeatureRolloutInterface::ATTR_FLAG        => Str::slug(fake()->words(3, true), '_') . '.' . fake()->word(),
            FeatureRolloutInterface::ATTR_SCOPE_LEVEL => 'tenant',
            FeatureRolloutInterface::ATTR_PERCENTAGE  => 50,
            FeatureRolloutInterface::ATTR_NOTES       => fake()->sentence(),
            FeatureRolloutInterface::ATTR_STARTS_AT   => null,
            FeatureRolloutInterface::ATTR_ENDS_AT     => null,
        ];
    }
}
