<?php

declare(strict_types=1);

namespace Academorix\Localization\Database\Factories;

use Academorix\Localization\Contracts\Data\TranslationInterface;
use Academorix\Localization\Enums\TranslationSource;
use Academorix\Localization\Models\PlatformLanguage;
use Academorix\Localization\Models\Translation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Translation}.
 *
 * @extends Factory<Translation>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class TranslationFactory extends Factory
{
    /**
     * @var class-string<Translation>
     */
    protected $model = Translation::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            TranslationInterface::ATTR_ID                 => 'trn_' . Str::ulid()->toBase32(),
            TranslationInterface::ATTR_TENANT_ID          => null,
            TranslationInterface::ATTR_LANGUAGE_ID        => PlatformLanguage::factory(),
            TranslationInterface::ATTR_TRANSLATION_JOB_ID => null,
            TranslationInterface::ATTR_NAMESPACE          => TranslationInterface::NAMESPACE_DEFAULT,
            TranslationInterface::ATTR_GROUP              => $this->faker->randomElement(['messages', 'validation', 'auth', 'passwords']),
            TranslationInterface::ATTR_KEY                => $this->faker->unique()->slug(3, false),
            TranslationInterface::ATTR_LOCALE_CODE        => 'en',
            TranslationInterface::ATTR_VALUE              => $this->faker->sentence(),
            TranslationInterface::ATTR_SOURCE             => TranslationSource::Manual,
            TranslationInterface::ATTR_PROVIDER           => null,
            TranslationInterface::ATTR_QUALITY_SCORE      => null,
            TranslationInterface::ATTR_SOURCE_HASH        => null,
            TranslationInterface::ATTR_IS_VERIFIED        => false,
            TranslationInterface::ATTR_IS_STALE           => false,
            TranslationInterface::ATTR_VERIFIED_BY        => null,
            TranslationInterface::ATTR_VERIFIED_AT        => null,
        ];
    }

    /**
     * State — pin the tenant id (default = platform default row).
     *
     * @param  string  $tenantId  The tenant id to pin.
     */
    public function forTenant(string $tenantId): static
    {
        return $this->state(fn (): array => [
            TranslationInterface::ATTR_TENANT_ID => $tenantId,
        ]);
    }

    /**
     * State — mark the row as machine-produced.
     */
    public function machine(): static
    {
        return $this->state(fn (): array => [
            TranslationInterface::ATTR_SOURCE        => TranslationSource::Machine,
            TranslationInterface::ATTR_PROVIDER      => 'openai',
            TranslationInterface::ATTR_QUALITY_SCORE => $this->faker->randomFloat(4, 0.7, 1.0),
        ]);
    }

    /**
     * State — mark the row as human-verified.
     */
    public function verified(): static
    {
        return $this->state(fn (): array => [
            TranslationInterface::ATTR_IS_VERIFIED => true,
            TranslationInterface::ATTR_VERIFIED_AT => now(),
        ]);
    }
}
