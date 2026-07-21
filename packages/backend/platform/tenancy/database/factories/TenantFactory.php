<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Database\Factories;

use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Tenancy\Contracts\Data\TenantInterface;
use Stackra\Tenancy\Enums\TenantStatus;
use Stackra\Tenancy\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Tenant}.
 *
 * Produces `active`, non-system rows by default. States:
 *   - `->trialing()` — flips status to trialing + sets trial_ends_at.
 *   - `->suspended()` — flips status to suspended + suspended_at now.
 *   - `->archived()` — flips status to archived + archived_at now.
 *   - `->system()` — flips is_system on (seed-only, immutable via API).
 *
 * @extends Factory<Tenant>
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<Tenant>
     */
    protected $model = Tenant::class;

    /**
     * Default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $slug = 'tenant-' . Str::random(8);

        return [
            TenantInterface::ATTR_ID             => 'ten_' . Str::ulid()->toBase32(),
            TenantInterface::ATTR_APPLICATION_ID => 'app_' . Str::ulid()->toBase32(),
            TenantInterface::ATTR_SLUG           => $slug,
            TenantInterface::ATTR_NAME           => $this->faker->company(),
            TenantInterface::ATTR_LEGAL_NAME     => $this->faker->company() . ' Inc.',
            TenantInterface::ATTR_STATUS         => TenantStatus::Active->value,
            TenantInterface::ATTR_BUSINESS_TYPE  => BusinessTypeEnum::SportsCenter->value,
            TenantInterface::ATTR_LOCALE         => 'en',
            TenantInterface::ATTR_TIMEZONE       => 'UTC',
            TenantInterface::ATTR_CURRENCY       => 'USD',
            TenantInterface::ATTR_COUNTRY_CODE   => 'US',
            TenantInterface::ATTR_IS_SYSTEM      => false,
        ];
    }

    public function trialing(): static
    {
        return $this->state(fn (): array => [
            TenantInterface::ATTR_STATUS         => TenantStatus::Trialing->value,
            TenantInterface::ATTR_TRIAL_ENDS_AT  => \Carbon\CarbonImmutable::now()->addDays(14),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (): array => [
            TenantInterface::ATTR_STATUS       => TenantStatus::Suspended->value,
            TenantInterface::ATTR_SUSPENDED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (): array => [
            TenantInterface::ATTR_STATUS      => TenantStatus::Archived->value,
            TenantInterface::ATTR_ARCHIVED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (): array => [
            TenantInterface::ATTR_IS_SYSTEM => true,
        ]);
    }
}
