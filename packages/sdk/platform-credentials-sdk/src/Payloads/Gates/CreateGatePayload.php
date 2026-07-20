<?php

declare(strict_types=1);

namespace Academorix\PlatformCredentialsSdk\Payloads\Gates;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/gates` (or the
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
final class CreateGatePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $branchId
     * @param  string                       $label
     * @param  bool                         $isOnline
     * @param  string                       $readerType                 nfc / rfid / qr / hybrid.
     * @param  ?string                      $locationDescription
     * @param  ?string                      $deviceId                   Manufacturer/serial identifier.
     * @param  ?string                      $lastHeartbeatAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $branchId,

        #[StringType]
        public string $label,

        public bool $isOnline,

        #[StringType]
        public string $readerType,

        #[StringType]
        public ?string $locationDescription = null,

        #[StringType]
        public ?string $deviceId = null,

        #[StringType]
        public ?string $lastHeartbeatAt = null,

        public ?array $metadata = null,
    ) {
    }
}
