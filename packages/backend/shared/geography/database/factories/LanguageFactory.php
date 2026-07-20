<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\LanguageInterface;
use Academorix\Geography\Models\Language;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see Language}.
 *
 * @extends Factory<Language>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class LanguageFactory extends Factory
{
    /**
     * @var class-string<Language>
     */
    protected $model = Language::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            LanguageInterface::ATTR_COUNTRY_ID => null,
            LanguageInterface::ATTR_CODE       => \strtolower($this->faker->unique()->lexify('??')),
            LanguageInterface::ATTR_NAME       => $this->faker->languageCode() . ' Language',
            LanguageInterface::ATTR_NATIVE     => null,
            LanguageInterface::ATTR_DIR        => 'ltr',
            LanguageInterface::ATTR_IS_RTL     => false,
        ];
    }
}
