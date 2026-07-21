<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Database\Factories;

use Stackra\Tenancy\Contracts\Data\TenantContactInterface;
use Stackra\Tenancy\Enums\TenantContactKind;
use Stackra\Tenancy\Models\TenantContact;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see TenantContact}.
 *
 * Produces a `support` primary contact by default. States per kind:
 * `->billing()`, `->legal()`, `->dpo()`, `->technical()`, …
 *
 * @extends Factory<TenantContact>
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
final class TenantContactFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<TenantContact>
     */
    protected $model = TenantContact::class;

    /**
     * Default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            TenantContactInterface::ATTR_ID         => 'wct_' . Str::ulid()->toBase32(),
            TenantContactInterface::ATTR_TENANT_ID  => 'ten_' . Str::ulid()->toBase32(),
            TenantContactInterface::ATTR_KIND       => TenantContactKind::Support->value,
            TenantContactInterface::ATTR_NAME       => $this->faker->name(),
            TenantContactInterface::ATTR_EMAIL      => $this->faker->safeEmail(),
            TenantContactInterface::ATTR_PHONE      => $this->faker->e164PhoneNumber(),
            TenantContactInterface::ATTR_IS_PRIMARY => true,
        ];
    }

    public function billing(): static
    {
        return $this->state(fn (): array => [TenantContactInterface::ATTR_KIND => TenantContactKind::Billing->value]);
    }

    public function legal(): static
    {
        return $this->state(fn (): array => [TenantContactInterface::ATTR_KIND => TenantContactKind::Legal->value]);
    }

    public function dpo(): static
    {
        return $this->state(fn (): array => [TenantContactInterface::ATTR_KIND => TenantContactKind::Dpo->value]);
    }

    public function technical(): static
    {
        return $this->state(fn (): array => [TenantContactInterface::ATTR_KIND => TenantContactKind::Technical->value]);
    }

    public function verified(): static
    {
        return $this->state(fn (): array => [
            TenantContactInterface::ATTR_VERIFIED_AT => \Carbon\CarbonImmutable::now(),
        ]);
    }
}
