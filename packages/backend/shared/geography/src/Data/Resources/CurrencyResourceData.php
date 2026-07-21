<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Resources;

use Stackra\Geography\Contracts\Data\CurrencyInterface;
use Stackra\Geography\Models\Currency;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Currency}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class CurrencyResourceData extends Data
{
    /**
     * @param  int          $id            Numeric primary key.
     * @param  int          $countryId     Primary country FK.
     * @param  string       $name          English currency name.
     * @param  string       $code          ISO-4217 alpha code.
     * @param  string|null  $symbol        Currency symbol.
     * @param  string|null  $symbolNative  Native-script symbol.
     * @param  int          $precision     Decimal places.
     */
    public function __construct(
        public int $id,
        public int $countryId,
        public string $name,
        public string $code,
        public ?string $symbol,
        public ?string $symbolNative,
        public int $precision,
    ) {
    }

    /**
     * Build the DTO from a {@see Currency} model.
     */
    public static function fromModel(Currency $currency): self
    {
        return new self(
            id: (int) $currency->getKey(),
            countryId: (int) $currency->{CurrencyInterface::ATTR_COUNTRY_ID},
            name: (string) $currency->{CurrencyInterface::ATTR_NAME},
            code: (string) $currency->{CurrencyInterface::ATTR_CODE},
            symbol: self::nullableString($currency, CurrencyInterface::ATTR_SYMBOL),
            symbolNative: self::nullableString($currency, CurrencyInterface::ATTR_SYMBOL_NATIVE),
            precision: (int) ($currency->{CurrencyInterface::ATTR_PRECISION} ?? 2),
        );
    }

    /**
     * Coerce an attribute to a nullable string; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(Currency $currency, string $key): ?string
    {
        $value = $currency->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
