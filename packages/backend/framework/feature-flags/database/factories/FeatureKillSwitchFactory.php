<?php

declare(strict_types=1);

namespace Stackra\FeatureFlags\Database\Factories;

use Stackra\FeatureFlags\Contracts\Data\FeatureKillSwitchInterface;
use Stackra\FeatureFlags\Models\FeatureKillSwitch;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * Factory for {@see FeatureKillSwitch}.
 *
 * Produces platform-wide kill switches (`scope_level = 'global'`,
 * `scope_value = null`) enabled at `now()` and never disabled by
 * default. Tenant-scoped states available via `->forTenant($id)`.
 *
 * @extends Factory<FeatureKillSwitch>
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class FeatureKillSwitchFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<FeatureKillSwitch>
     */
    protected $model = FeatureKillSwitch::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            FeatureKillSwitchInterface::ATTR_FLAG        => Str::slug(fake()->words(3, true), '_') . '.' . fake()->word(),
            FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => 'global',
            FeatureKillSwitchInterface::ATTR_SCOPE_VALUE => null,
            FeatureKillSwitchInterface::ATTR_REASON      => fake()->sentence(),
            FeatureKillSwitchInterface::ATTR_ENABLED_AT  => Carbon::now(),
            FeatureKillSwitchInterface::ATTR_DISABLED_AT => null,
        ];
    }

    /**
     * State — target a specific tenant.
     *
     * @param  string  $tenantId  Prefixed-ULID tenant id.
     * @return self
     */
    public function forTenant(string $tenantId): self
    {
        return $this->state(fn (): array => [
            FeatureKillSwitchInterface::ATTR_SCOPE_LEVEL => 'tenant',
            FeatureKillSwitchInterface::ATTR_SCOPE_VALUE => $tenantId,
        ]);
    }
}
