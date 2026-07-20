<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `PATCH /api/v1/newsletters/{newsletter}/audiences/{audience}`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateAudienceRequestData extends Data
{
    /**
     * @param  array<string, mixed>|null  $expression
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[StringType, Max(2000)]
        public ?string $description = null,

        #[ArrayType]
        public ?array $expression = null,
    ) {
    }
}
