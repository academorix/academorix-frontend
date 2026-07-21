<?php

declare(strict_types=1);

namespace Stackra\Versioning\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/platform/versioning/api-versions/{slug}`.
 *
 * Only descriptive metadata is editable — the slug, scheme, and
 * lifecycle status are set at creation / transition time and cannot
 * change post-release.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateApiVersionRequestData extends Data
{
    public function __construct(
        #[StringType, Max(10000)]
        public ?string $description = null,

        #[StringType, Max(64)]
        public ?string $schemeValue = null,
    ) {
    }
}
