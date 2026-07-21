<?php

declare(strict_types=1);

namespace Stackra\SportsPrivateSessionsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PrivateSessionRequest}.
 *
 * Mirrors `schemas/private-session-request.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Sports service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->privateSessions()->privateSessionRequests()->show($id);
 * ```
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PrivateSessionRequestData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $requestedByUserId
     * @param  string                       $sportKey
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $preferredCoachId
     * @param  ?string                      $assignedCoachId
     * @param  array<string, mixed>|null    $preferredSlots
     * @param  ?string                      $notes
     * @param  ?string                      $scheduledSessionId
     * @param  ?string                      $completedAt
     * @param  ?string                      $cancellationReason
     * @param  ?string                      $invoiceId
     * @param  ?string                      $consumedCreditId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteId,
        public string $requestedByUserId,
        public string $sportKey,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $preferredCoachId = null,
        public ?string $assignedCoachId = null,
        public ?array $preferredSlots = null,
        public ?string $notes = null,
        public ?string $scheduledSessionId = null,
        public ?string $completedAt = null,
        public ?string $cancellationReason = null,
        public ?string $invoiceId = null,
        public ?string $consumedCreditId = null,
        public ?array $metadata = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        // Delegate to Spatie Data's canonical hydration path so
        // `#[MapInputName]` fires and every property is normalised
        // through the same mapper the response-side uses.
        return self::from($row);
    }
}
