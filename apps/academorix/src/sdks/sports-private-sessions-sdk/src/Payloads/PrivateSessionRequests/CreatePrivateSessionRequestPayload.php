<?php

declare(strict_types=1);

namespace Stackra\SportsPrivateSessionsSdk\Payloads\PrivateSessionRequests;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/private-session-requests` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreatePrivateSessionRequestPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $requestedByUserId
     * @param  string                       $sportKey
     * @param  string                       $status
     * @param  ?string                      $preferredCoachId
     * @param  ?string                      $assignedCoachId
     * @param  ?array                       $preferredSlots
     * @param  ?string                      $notes
     * @param  ?string                      $scheduledSessionId
     * @param  ?string                      $completedAt
     * @param  ?string                      $cancellationReason
     * @param  ?string                      $invoiceId
     * @param  ?string                      $consumedCreditId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteId,

        #[StringType]
        public string $requestedByUserId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $preferredCoachId = null,

        #[StringType]
        public ?string $assignedCoachId = null,

        public ?array $preferredSlots = null,

        #[StringType]
        public ?string $notes = null,

        #[StringType]
        public ?string $scheduledSessionId = null,

        #[StringType]
        public ?string $completedAt = null,

        #[StringType]
        public ?string $cancellationReason = null,

        #[StringType]
        public ?string $invoiceId = null,

        #[StringType]
        public ?string $consumedCreditId = null,

        public ?array $metadata = null,
    ) {
    }
}
