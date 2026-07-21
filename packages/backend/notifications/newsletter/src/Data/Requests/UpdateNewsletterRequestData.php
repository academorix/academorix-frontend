<?php

declare(strict_types=1);

namespace Stackra\Newsletter\Data\Requests;

use Stackra\Newsletter\Enums\NewsletterCadence;
use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Attributes\Validation\BooleanType;
use Spatie\LaravelData\Attributes\Validation\Enum;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Validated payload for `PATCH /api/v1/newsletters/{newsletter}`.
 *
 * Every field is optional — the action applies only the keys the
 * caller sent.
 *
 * @category Newsletter
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class UpdateNewsletterRequestData extends Data
{
    /**
     * @param  array<string, mixed>|null  $senderConfig
     * @param  array<string, mixed>|null  $brand
     * @param  array<string, mixed>|null  $reputationThresholds
     */
    public function __construct(
        #[StringType, Max(200)]
        public ?string $name = null,

        #[StringType, Max(2000)]
        public ?string $description = null,

        #[Enum(NewsletterCadence::class)]
        public ?NewsletterCadence $cadence = null,

        #[BooleanType]
        public ?bool $confirmationRequired = null,

        public ?array $senderConfig = null,

        public ?array $brand = null,

        public ?array $reputationThresholds = null,
    ) {
    }
}
