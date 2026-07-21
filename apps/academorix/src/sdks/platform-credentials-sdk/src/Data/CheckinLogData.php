<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\CheckinLog}.
 *
 * Mirrors `schemas/checkin-log.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Platform service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->credentials()->checkinLogs()->show($id);
 * ```
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CheckinLogData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $gateId
     * @param  string                       $uid
     * @param  string                       $direction                  in / out.
     * @param  string                       $recordedAt
     * @param  bool                         $resolved                   TRUE when successfully forwarded to attendance.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $credentialId
     * @param  ?string                      $attendanceRecordId
     * @param  ?string                      $unresolvedReason
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $gateId,
        public string $uid,
        public string $direction,
        public string $recordedAt,
        public bool $resolved,
        public string $createdAt,
        public string $updatedAt,
        public ?string $credentialId = null,
        public ?string $attendanceRecordId = null,
        public ?string $unresolvedReason = null,
        public ?array $metadata = null,
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
