<?php

declare(strict_types=1);

namespace Academorix\Newsletter\Data\Requests;

use Academorix\Newsletter\Enums\NewsletterCadence;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\Required;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `POST /api/v1/newsletters`.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CreateNewsletterRequestData extends Data
{
    /**
     * @param  array<string, mixed>|null  $senderConfig
     * @param  array<string, mixed>|null  $brand
     * @param  array<string, mixed>|null  $reputationThresholds
     */
    public function __construct(
        #[Required, StringType, Max(200)]
        public string $name,

        #[Required, StringType, Max(191), Regex('/^[a-z0-9-]+$/')]
        public string $slug,

        #[Required, Enum(NewsletterCadence::class)]
        public NewsletterCadence $cadence,

        #[StringType, Max(2000)]
        public ?string $description = null,

        #[BooleanType]
        public bool $confirmationRequired = true,

        public ?array $senderConfig = null,

        public ?array $brand = null,

        public ?array $reputationThresholds = null,
    ) {
    }
}
