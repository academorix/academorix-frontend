<?php

declare(strict_types=1);

namespace Academorix\SportsAwardsSdk\Payloads\Awards;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/awards` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category AwardsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateAwardPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $awardTypeCode              motm / most_improved / attendance_streak_10 / belt_promotion / tournament_winner / benchmark_broken / goal_achieved / cu...
     * @param  string                       $title
     * @param  string                       $grantedAt
     * @param  bool                         $isAutoGranted
     * @param  ?string                      $description
     * @param  ?string                      $grantedByUserId
     * @param  ?string                      $evidenceType               event / attendance_streak / benchmark / grading_result / goal.
     * @param  ?string                      $evidenceId
     * @param  ?string                      $autoGrantRule
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedReason
     * @param  ?string                      $certificateId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteId,

        #[StringType]
        public string $awardTypeCode,

        #[StringType]
        public string $title,

        #[StringType]
        public string $grantedAt,

        public bool $isAutoGranted,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $grantedByUserId = null,

        #[StringType]
        public ?string $evidenceType = null,

        #[StringType]
        public ?string $evidenceId = null,

        #[StringType]
        public ?string $autoGrantRule = null,

        #[StringType]
        public ?string $revokedAt = null,

        #[StringType]
        public ?string $revokedReason = null,

        #[StringType]
        public ?string $certificateId = null,

        public ?array $metadata = null,
    ) {
    }
}
