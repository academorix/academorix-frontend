<?php

declare(strict_types=1);

namespace Stackra\Localization\Database\Factories;

use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Models\PlatformLanguage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see PlatformLanguage}.
 *
 * @extends Factory<PlatformLanguage>
 *
 * @category Localization
 *
 * @since    0.1.0
 */
final class PlatformLanguageFactory extends Factory
{
    /**
     * @var class-string<PlatformLanguage>
     */
    protected $model = PlatformLanguage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $bcp47 = $this->faker->unique()->randomElement([
            'en', 'fr', 'es', 'de', 'ar', 'pt', 'it', 'nl', 'ja', 'zh-Hans', 'zh-Hant',
            'ko', 'tr', 'ru', 'sv', 'da', 'fi', 'no', 'cs', 'el', 'hu', 'ro', 'pl',
        ]);

        return [
            PlatformLanguageInterface::ATTR_ID                    => 'lng_' . Str::ulid()->toBase32(),
            PlatformLanguageInterface::ATTR_BCP47_CODE            => $bcp47,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_LANGUAGE_ID => 1,
            PlatformLanguageInterface::ATTR_GEOGRAPHY_COUNTRY_ID  => null,
            PlatformLanguageInterface::ATTR_SCRIPT                => 'Latn',
            PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE    => true,
            PlatformLanguageInterface::ATTR_IS_BETA               => false,
            PlatformLanguageInterface::ATTR_IS_SYSTEM             => false,
            PlatformLanguageInterface::ATTR_SORT_ORDER            => 0,
            PlatformLanguageInterface::ATTR_NOTES                 => null,
            PlatformLanguageInterface::ATTR_METADATA              => null,
        ];
    }

    /**
     * State — mark the row as a system-shipped default.
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            PlatformLanguageInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * State — mark the row as beta / preview only.
     */
    public function beta(): static
    {
        return $this->state(fn (): array => [
            PlatformLanguageInterface::ATTR_IS_BETA => true,
        ]);
    }

    /**
     * State — mark the row as an RTL language (script default swaps
     * to Arab so the fake stays coherent).
     */
    public function rtl(): static
    {
        return $this->state(fn (): array => [
            PlatformLanguageInterface::ATTR_BCP47_CODE => 'ar',
            PlatformLanguageInterface::ATTR_SCRIPT     => 'Arab',
        ]);
    }
}
