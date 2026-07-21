<?php

declare(strict_types=1);

namespace Stackra\Versioning\Data\Requests;

use Stackra\Versioning\Enums\DeprecationSurface;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/platform/versioning/deprecation-notices`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateDeprecationNoticeRequestData extends Data
{
    public function __construct(
        #[Required, StringType, Max(64)]
        public string $apiVersionId,

        #[Required, Enum(DeprecationSurface::class)]
        public DeprecationSurface $surface,

        #[Required, StringType, Max(200)]
        public string $title,

        #[Required, StringType, Max(10000)]
        public string $body,

        #[StringType]
        public ?string $startsAt = null,

        #[StringType]
        public ?string $endsAt = null,

        public bool $isActive = false,

        #[StringType, Max(32)]
        public ?string $replacementVersion = null,
    ) {
    }
}
