<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/platform/geography/countries/{country}`.
 *
 * Every field is `Optional` so partial updates leave untouched fields
 * on the persisted row (Spatie's `Optional` opts the field out of
 * mass-assignment when the caller doesn't send it).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateCountryRequestData extends Data
{
    /**
     * @param  Optional|string       $iso2       ISO-3166 alpha-2.
     * @param  Optional|string       $name       English display name.
     * @param  Optional|string|null  $iso3       ISO-3166 alpha-3.
     * @param  Optional|string|null  $native     Local-script name.
     * @param  Optional|string|null  $phoneCode  E.164 calling code.
     * @param  Optional|string|null  $region     UN M49 region.
     * @param  Optional|string|null  $subregion  UN M49 subregion.
     * @param  Optional|string|null  $latitude   Approximate latitude.
     * @param  Optional|string|null  $longitude  Approximate longitude.
     * @param  Optional|string|null  $emoji      Flag emoji character.
     * @param  Optional|string|null  $emojiU     Unicode escape.
     * @param  Optional|int          $status     1 = active, 0 = deprecated.
     */
    public function __construct(
        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public Optional|string $iso2,

        #[StringType, Max(100)]
        public Optional|string $name,

        #[StringType, Regex('/^[A-Za-z]{3}$/')]
        public Optional|string|null $iso3,

        #[StringType, Max(100)]
        public Optional|string|null $native,

        #[StringType, Max(10)]
        public Optional|string|null $phoneCode,

        #[StringType, Max(50)]
        public Optional|string|null $region,

        #[StringType, Max(50)]
        public Optional|string|null $subregion,

        #[StringType, Max(30)]
        public Optional|string|null $latitude,

        #[StringType, Max(30)]
        public Optional|string|null $longitude,

        #[StringType, Max(10)]
        public Optional|string|null $emoji,

        #[StringType, Max(20)]
        public Optional|string|null $emojiU,

        #[In([0, 1])]
        public Optional|int $status,
    ) {
    }
}
