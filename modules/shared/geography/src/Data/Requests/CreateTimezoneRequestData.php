<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/geography/timezones`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateTimezoneRequestData extends Data
{
    /**
     * @param  int     $countryId    Parent country primary key.
     * @param  string  $name         IANA name (e.g. `Europe/Paris`).
     * @param  string  $countryCode  ISO-3166 alpha-2 of the parent country.
     */
    public function __construct(
        #[IntegerType]
        public int $countryId,

        #[StringType, Max(100), Regex('/^[A-Za-z]+(\/[A-Za-z_\-]+)*$/')]
        public string $name,

        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public string $countryCode,
    ) {
    }
}
