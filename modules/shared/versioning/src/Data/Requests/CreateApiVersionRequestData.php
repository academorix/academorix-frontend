<?php

declare(strict_types=1);

namespace Academorix\Versioning\Data\Requests;

use Academorix\Versioning\Enums\VersionScheme;
use Academorix\Versioning\Rules\ValidVersionSlug;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\Rule;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/platform/versioning/api-versions`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateApiVersionRequestData extends Data
{
    public function __construct(
        #[Required, StringType, Max(32), Rule(new ValidVersionSlug())]
        public string $slug,

        #[Required, Enum(VersionScheme::class)]
        public VersionScheme $scheme,

        #[Required, StringType, Max(64)]
        public string $schemeValue,

        #[StringType, Max(10000)]
        public ?string $description = null,
    ) {
    }
}
