<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Payloads\CoachNotes;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/coach-notes` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateCoachNotePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteEnrollmentId
     * @param  string                       $coachUserId
     * @param  string                       $body
     * @param  string                       $visibility
     * @param  ?string                      $revisionOfId
     * @param  ?string                      $sharedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteEnrollmentId,

        #[StringType]
        public string $coachUserId,

        #[StringType]
        public string $body,

        #[StringType]
        public string $visibility,

        #[StringType]
        public ?string $revisionOfId = null,

        #[StringType]
        public ?string $sharedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
