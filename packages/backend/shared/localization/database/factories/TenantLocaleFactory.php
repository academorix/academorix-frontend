<?php

declare(strict_types=1);

namespace Stackra\Localization\Database\Factories;

use Stackra\Localization\Contracts\Data\TenantLocaleInterface;
use Stackra\Localization\Models\PlatformLanguage;
use Stackra\Localization\Models\TenantLocale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see TenantLocale}.
 *
 * @extends Factory<TenantLocale>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TenantLocaleFactory extends Factory
{
    /**
     * @var class-string<TenantLocale>
     */
    protected $model = TenantLocale::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            TenantLocaleInterface::ATTR_ID                    => 'tll_' . Str::ulid()->toBase32(),
            TenantLocaleInterface::ATTR_TENANT_ID             => 'ten_' . Str::ulid()->toBase32(),
            TenantLocaleInterface::ATTR_LANGUAGE_ID           => PlatformLanguage::factory(),
            TenantLocaleInterface::ATTR_IS_DEFAULT            => false,
            TenantLocaleInterface::ATTR_IS_FALLBACK           => false,
            TenantLocaleInterface::ATTR_IS_ACTIVE             => true,
            TenantLocaleInterface::ATTR_AUTO_TRANSLATE_DRIVER => null,
            TenantLocaleInterface::ATTR_MIN_QUALITY_SCORE     => null,
        ];
    }

    /**
     * State — mark the row as the tenant's default locale.
     */
    public function asDefault(): static
    {
        return $this->state(fn (): array => [
            TenantLocaleInterface::ATTR_IS_DEFAULT => true,
        ]);
    }

    /**
     * State — mark the row as the tenant's fallback locale.
     */
    public function asFallback(): static
    {
        return $this->state(fn (): array => [
            TenantLocaleInterface::ATTR_IS_FALLBACK => true,
        ]);
    }

    /**
     * State — pin a specific tenant id.
     *
     * @param  string  $tenantId  The tenant id to pin.
     */
    public function forTenant(string $tenantId): static
    {
        return $this->state(fn (): array => [
            TenantLocaleInterface::ATTR_TENANT_ID => $tenantId,
        ]);
    }
}
