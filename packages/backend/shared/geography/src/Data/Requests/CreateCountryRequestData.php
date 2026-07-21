<?php

declare(strict_types=1);

namespace Stackra\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/geography/countries`.
 *
 * Rare — platform admins only hotfix vendor rows. The vendor seeder
 * remains the source of truth; overrides carry `updated_by` so
 * `world:install --force` skips them.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateCountryRequestData extends Data
{
    /**
     * @param  string       $iso2       ISO-3166 alpha-2 (2 uppercase letters).
     * @param  string       $name       English display name.
     * @param  string|null  $iso3       ISO-3166 alpha-3 (3 uppercase letters).
     * @param  string|null  $native     Local-script name.
     * @param  string|null  $phoneCode  E.164 calling code.
     * @param  string|null  $region     UN M49 region.
     * @param  string|null  $subregion  UN M49 subregion.
     * @param  string|null  $latitude   Approximate latitude.
     * @param  string|null  $longitude  Approximate longitude.
     * @param  string|null  $emoji      Flag emoji character.
     * @param  string|null  $emojiU     Unicode escape for the flag.
     * @param  int          $status     1 = active, 0 = deprecated.
     */
    public function __construct(
        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public string $iso2,

        #[StringType, Max(100)]
        public string $name,

        #[StringType, Regex('/^[A-Za-z]{3}$/')]
        public ?string $iso3 = null,

        #[StringType, Max(100)]
        public ?string $native = null,

        #[StringType, Max(10)]
        public ?string $phoneCode = null,

        #[StringType, Max(50)]
        public ?string $region = null,

        #[StringType, Max(50)]
        public ?string $subregion = null,

        #[StringType, Max(30)]
        public ?string $latitude = null,

        #[StringType, Max(30)]
        public ?string $longitude = null,

        #[StringType, Max(10)]
        public ?string $emoji = null,

        #[StringType, Max(20)]
        public ?string $emojiU = null,

        #[In([0, 1])]
        public int $status = 1,
    ) {
    }
}
