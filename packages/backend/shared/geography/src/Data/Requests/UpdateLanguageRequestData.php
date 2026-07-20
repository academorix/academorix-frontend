<?php

declare(strict_types=1);

namespace Academorix\Geography\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\In;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/platform/geography/languages/{language}`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateLanguageRequestData extends Data
{
    public function __construct(
        #[StringType, Regex('/^[A-Za-z]{2}$/')]
        public Optional|string $code,

        #[StringType, Max(100)]
        public Optional|string $name,

        #[StringType, Max(100)]
        public Optional|string|null $native,

        #[StringType, In(['ltr', 'rtl'])]
        public Optional|string|null $dir,

        #[BooleanType]
        public Optional|bool $isRtl,
    ) {
    }
}
