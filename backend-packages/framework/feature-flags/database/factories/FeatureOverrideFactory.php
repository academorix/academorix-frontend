<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Database\Factories;

use Academorix\FeatureFlags\Contracts\Data\FeatureOverrideInterface;
use Academorix\FeatureFlags\Enums\OverrideDecision;
use Academorix\FeatureFlags\Models\FeatureOverride;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see FeatureOverride}.
 *
 * Produces rows with `decision = deny` at `scope_level = tenant`
 * by default. Callers pass an explicit `tenant_id` when running
 * outside tenant context.
 *
 * @extends Factory<FeatureOverride>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureOverrideFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<FeatureOverride>
     */
    protected $model = FeatureOverride::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            FeatureOverrideInterface::ATTR_FLAG        => Str::slug(fake()->words(3, true), '_') . '.' . fake()->word(),
            FeatureOverrideInterface::ATTR_SCOPE_LEVEL => 'tenant',
            FeatureOverrideInterface::ATTR_SCOPE_VALUE => (string) Str::ulid(),
            FeatureOverrideInterface::ATTR_DECISION    => OverrideDecision::Deny->value,
            FeatureOverrideInterface::ATTR_REASON      => fake()->sentence(),
            FeatureOverrideInterface::ATTR_EXPIRES_AT  => null,
        ];
    }

    /**
     * State — flip the decision to `allow`.
     *
     * @return self
     */
    public function allow(): self
    {
        return $this->state(fn (): array => [
            FeatureOverrideInterface::ATTR_DECISION => OverrideDecision::Allow->value,
        ]);
    }
}
