<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Payloads\TalentFlags;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/talent-flags` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateTalentFlagPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $flaggedByUserId
     * @param  string                       $reason
     * @param  string                       $priority
     * @param  ?string                      $resolvedAt
     * @param  ?string                      $resolutionNotes
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteId,

        #[StringType]
        public string $flaggedByUserId,

        #[StringType]
        public string $reason,

        #[StringType]
        public string $priority,

        #[StringType]
        public ?string $resolvedAt = null,

        #[StringType]
        public ?string $resolutionNotes = null,

        public ?array $metadata = null,
    ) {
    }
}
