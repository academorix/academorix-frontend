<?php

declare(strict_types=1);

namespace Stackra\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/languages`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreatePlatformLanguageRequestData extends Data
{
    /**
     * @param  string       $bcp47Code             BCP-47 tag.
     * @param  int          $geographyLanguageId  FK to `languages.id`.
     * @param  int|null     $geographyCountryId   FK to `countries.id`. Optional.
     * @param  string|null  $script                ISO-15924 script code.
     * @param  bool         $isPlatformActive     Row is enabled for tenants.
     * @param  bool         $isBeta                Row is beta / preview.
     * @param  int          $sortOrder             UI ordering hint.
     * @param  string|null  $notes                 Ops notes.
     */
    public function __construct(
        #[Required, StringType, Max(32)]
        public string $bcp47Code,

        #[Required, IntegerType]
        public int $geographyLanguageId,

        #[IntegerType]
        public ?int $geographyCountryId = null,

        #[StringType, Max(8)]
        public ?string $script = null,

        #[BooleanType]
        public bool $isPlatformActive = true,

        #[BooleanType]
        public bool $isBeta = false,

        #[IntegerType]
        public int $sortOrder = 0,

        #[StringType]
        public ?string $notes = null,
    ) {
    }
}
