<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/translations/{translation}`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateTranslationRequestData extends Data
{
    /**
     * @param  string|Optional  $value        Overwrite the translated string.
     * @param  bool|Optional    $isVerified   Toggle the human-verified flag.
     */
    public function __construct(
        #[StringType]
        public string|Optional $value = new Optional(),

        #[BooleanType]
        public bool|Optional $isVerified = new Optional(),
    ) {
    }
}
