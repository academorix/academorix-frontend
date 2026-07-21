<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Between;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/platform/geography/currencies/{currency}`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateCurrencyRequestData extends Data
{
    public function __construct(
        #[StringType, Max(100)]
        public Optional|string $name,

        #[StringType, Regex('/^[A-Za-z]{3}$/')]
        public Optional|string $code,

        #[IntegerType, Between(0, 8)]
        public Optional|int $precision,

        #[StringType, Max(10)]
        public Optional|string|null $symbol,

        #[StringType, Max(10)]
        public Optional|string|null $symbolNative,
    ) {
    }
}
