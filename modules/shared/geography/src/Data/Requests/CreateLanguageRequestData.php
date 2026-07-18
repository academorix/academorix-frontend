<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/geography/languages`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateLanguageRequestData extends Data
{
    /**
     * @param  string       $code       ISO-639-1 alpha-2 (2 lowercase letters).
     * @param  string       $name       English name.
     * @param  int|null     $countryId  Primary country association.
     * @param  string|null  $native     Native-script name.
     * @param  string|null  $dir        Text direction — `ltr` / `rtl`.
     * @param  bool         $isRtl      Denormalised RTL flag.
     */
    public function __construct(
        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public string $code,

        #[StringType, Max(100)]
        public string $name,

        #[IntegerType]
        public ?int $countryId = null,

        #[StringType, Max(100)]
        public ?string $native = null,

        #[StringType, In(['ltr', 'rtl'])]
        public ?string $dir = null,

        #[BooleanType]
        public bool $isRtl = false,
    ) {
    }
}
