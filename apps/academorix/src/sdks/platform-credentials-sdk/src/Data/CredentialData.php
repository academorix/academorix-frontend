<?php

declare(strict_types=1);

namespace Stackra\PlatformCredentialsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Credential}.
 *
 * Mirrors `schemas/credential.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->credentials()->credentials()->show($id);
 * ```
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CredentialData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $uid                        Hex-encoded NFC/RFID UID (typically 8 or 14 hex chars for MIFARE/NTAG).
     * @param  string                       $kind                       nfc / rfid / qr / wristband / card.
     * @param  string                       $holderType                 Polymorphic — athletes / staff.
     * @param  string                       $holderId
     * @param  string                       $issuedAt
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $branchId                   Branch that issued the credential.
     * @param  ?string                      $activatedAt
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedReason
     * @param  ?string                      $replacedByCredentialId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $uid,
        public string $kind,
        public string $holderType,
        public string $holderId,
        public string $issuedAt,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $branchId = null,
        public ?string $activatedAt = null,
        public ?string $revokedAt = null,
        public ?string $revokedReason = null,
        public ?string $replacedByCredentialId = null,
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
