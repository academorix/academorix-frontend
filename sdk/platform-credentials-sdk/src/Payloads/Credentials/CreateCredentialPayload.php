<?php

declare(strict_types=1);

namespace Academorix\PlatformCredentialsSdk\Payloads\Credentials;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/credentials` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateCredentialPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $uid                        Hex-encoded NFC/RFID UID (typically 8 or 14 hex chars for MIFARE/NTAG).
     * @param  string                       $kind                       nfc / rfid / qr / wristband / card.
     * @param  string                       $holderType                 Polymorphic — athletes / staff.
     * @param  string                       $holderId
     * @param  string                       $issuedAt
     * @param  string                       $status
     * @param  ?string                      $branchId                   Branch that issued the credential.
     * @param  ?string                      $activatedAt
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedReason
     * @param  ?string                      $replacedByCredentialId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $uid,

        #[StringType]
        public string $kind,

        #[StringType]
        public string $holderType,

        #[StringType]
        public string $holderId,

        #[StringType]
        public string $issuedAt,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $branchId = null,

        #[StringType]
        public ?string $activatedAt = null,

        #[StringType]
        public ?string $revokedAt = null,

        #[StringType]
        public ?string $revokedReason = null,

        #[StringType]
        public ?string $replacedByCredentialId = null,

        public ?array $metadata = null,
    ) {
    }
}
