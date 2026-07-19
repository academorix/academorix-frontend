<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\IntegerType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Validated payload for `PATCH /api/v1/platform/languages/{language}`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdatePlatformLanguageRequestData extends Data
{
    /**
     * @param  string|Optional      $script             Update the ISO-15924 script code.
     * @param  bool|Optional        $isPlatformActive  Toggle platform-active.
     * @param  bool|Optional        $isBeta             Toggle beta flag.
     * @param  int|Optional         $sortOrder          Update sort order.
     * @param  string|null|Optional $notes              Update ops notes.
     */
    public function __construct(
        #[StringType, Max(8)]
        public string|Optional $script = new Optional(),

        #[BooleanType]
        public bool|Optional $isPlatformActive = new Optional(),

        #[BooleanType]
        public bool|Optional $isBeta = new Optional(),

        #[IntegerType]
        public int|Optional $sortOrder = new Optional(),

        #[StringType]
        public string|null|Optional $notes = new Optional(),
    ) {
    }
}
