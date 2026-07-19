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
 * Validated payload for `POST /api/v1/platform/geography/states`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateStateRequestData extends Data
{
    /**
     * @param  int          $countryId    Parent country primary key.
     * @param  string       $name         English state name.
     * @param  string       $countryCode  ISO-3166 alpha-2 of the parent country.
     * @param  string|null  $stateCode    ISO-3166-2 sub-code.
     * @param  string|null  $type         state / province / region / district / territory.
     * @param  string|null  $latitude     Approximate latitude.
     * @param  string|null  $longitude    Approximate longitude.
     */
    public function __construct(
        #[IntegerType]
        public int $countryId,

        #[StringType, Max(150)]
        public string $name,

        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public string $countryCode,

        #[StringType, Max(20)]
        public ?string $stateCode = null,

        #[StringType, Max(50)]
        public ?string $type = null,

        #[StringType, Max(30)]
        public ?string $latitude = null,

        #[StringType, Max(30)]
        public ?string $longitude = null,
    ) {
    }
}
