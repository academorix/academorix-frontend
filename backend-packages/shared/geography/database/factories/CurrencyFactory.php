<?php

declare(strict_types=1);

namespace Academorix\Geography\Database\Factories;

use Academorix\Geography\Contracts\Data\CurrencyInterface;
use Academorix\Geography\Models\Currency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see Currency}.
 *
 * @extends Factory<Currency>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class CurrencyFactory extends Factory
{
    /**
     * @var class-string<Currency>
     */
    protected $model = Currency::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            CurrencyInterface::ATTR_COUNTRY_ID    => 1,
            CurrencyInterface::ATTR_NAME          => $this->faker->currencyCode() . ' Currency',
            CurrencyInterface::ATTR_CODE          => \strtoupper($this->faker->unique()->lexify('???')),
            CurrencyInterface::ATTR_SYMBOL        => $this->faker->randomElement(['$', '€', '£', '¥', '₹']),
            CurrencyInterface::ATTR_SYMBOL_NATIVE => $this->faker->randomElement(['$', '€', '£', '¥', '₹']),
            CurrencyInterface::ATTR_PRECISION     => 2,
        ];
    }
}
