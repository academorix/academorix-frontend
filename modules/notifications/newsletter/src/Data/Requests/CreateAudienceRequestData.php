<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/newsletters/{newsletter}/audiences`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateAudienceRequestData extends Data
{
    /**
     * @param  array<string, mixed>|null  $expression
     */
    public function __construct(
        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, StringType, Max(191), Regex('/^[a-z0-9-]+$/')]
        public string $slug,

        #[StringType, Max(2000)]
        public ?string $description = null,

        #[ArrayType]
        public ?array $expression = null,
    ) {
    }
}
