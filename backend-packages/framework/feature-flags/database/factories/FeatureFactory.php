<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Database\Factories;

use Academorix\FeatureFlags\Contracts\Data\FeatureInterface;
use Academorix\FeatureFlags\Enums\FlagKind;
use Academorix\FeatureFlags\Models\Feature;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Feature}.
 *
 * Produces catalog rows with a dot-separated `name`, a random
 * `FlagKind`, and `default_off = true` by default. States are
 * added ad-hoc (`->killSwitch()`, `->planGate()`, `->on()`) for
 * fixture setup in tests.
 *
 * @extends Factory<Feature>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<Feature>
     */
    protected $model = Feature::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            FeatureInterface::ATTR_NAME        => Str::slug(fake()->words(3, true), '_') . '.' . fake()->word(),
            FeatureInterface::ATTR_DESCRIPTION => fake()->sentence(),
            FeatureInterface::ATTR_KIND        => fake()->randomElement(FlagKind::cases())->value,
            FeatureInterface::ATTR_DEFAULT_OFF => true,
            FeatureInterface::ATTR_CACHE_TTL   => null,
        ];
    }
}
