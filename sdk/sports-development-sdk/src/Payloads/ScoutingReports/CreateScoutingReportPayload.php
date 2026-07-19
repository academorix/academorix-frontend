<?php

declare(strict_types=1);

namespace Academorix\SportsDevelopmentSdk\Payloads\ScoutingReports;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/scouting-reports` (or the
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
final class CreateScoutingReportPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $scoutUserId
     * @param  string                       $observedAt
     * @param  string                       $narrative
     * @param  bool                         $recommendPromotion
     * @param  ?string                      $context                    match / training / trial / tournament.
     * @param  ?int                         $ratingOverall              1-10.
     * @param  ?array                       $strengths
     * @param  ?array                       $areasToDevelop
     * @param  ?array                       $tags
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteId,

        #[StringType]
        public string $scoutUserId,

        #[StringType]
        public string $observedAt,

        #[StringType]
        public string $narrative,

        public bool $recommendPromotion,

        #[StringType]
        public ?string $context = null,

        public ?int $ratingOverall = null,

        public ?array $strengths = null,

        public ?array $areasToDevelop = null,

        public ?array $tags = null,

        public ?array $metadata = null,
    ) {
    }
}
