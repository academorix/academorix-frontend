<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/geography/currencies`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateCurrencyRequestData extends Data
{
    /**
     * @param  int          $countryId     Primary country FK.
     * @param  string       $name          English currency name.
     * @param  string       $code          ISO-4217 alpha code (3 uppercase letters).
     * @param  int          $precision     Decimal places (0-8).
     * @param  string|null  $symbol        Currency symbol.
     * @param  string|null  $symbolNative  Native-script symbol.
     */
    public function __construct(
        #[IntegerType]
        public int $countryId,

        #[StringType, Max(100)]
        public string $name,

        #[StringType, Regex('/^[A-Za-z]{3}$/')]
        public string $code,

        #[IntegerType, Between(0, 8)]
        public int $precision = 2,

        #[StringType, Max(10)]
        public ?string $symbol = null,

        #[StringType, Max(10)]
        public ?string $symbolNative = null,
    ) {
    }
}
