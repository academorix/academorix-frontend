<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\ArrayType;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for
 * `POST /api/v1/newsletters/{newsletter}/issues`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateNewsletterIssueRequestData extends Data
{
    /**
     * @param  list<array<string, mixed>>|null  $contentBlocks
     * @param  array<string, mixed>|null        $variables
     */
    public function __construct(
        #[Required, StringType, Max(500)]
        public string $subject,

        #[StringType, Max(500)]
        public ?string $preheader = null,

        #[ArrayType]
        public ?array $contentBlocks = null,

        #[ArrayType]
        public ?array $variables = null,

        #[StringType, Max(191)]
        public ?string $slug = null,
    ) {
    }
}
