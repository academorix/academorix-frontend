<?php

declare(strict_types=1);

namespace Stackra\PlatformSafeguardingSdk\Payloads\BackgroundChecks;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/background-checks` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateBackgroundCheckPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $staffId
     * @param  string                       $checkType                  dbs_enhanced / dbs_basic / state_bci / safesport / custom.
     * @param  string                       $status                     pending / verified / expired / revoked.
     * @param  ?string                      $issuingAuthority
     * @param  ?string                      $issuedAt
     * @param  ?string                      $expiresAt
     * @param  ?string                      $verifiedAt
     * @param  ?string                      $verifiedByUserId
     * @param  ?string                      $verificationUrl
     * @param  ?string                      $documentId
     * @param  ?string                      $referenceNumber
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $staffId,

        #[StringType]
        public string $checkType,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $issuingAuthority = null,

        #[StringType]
        public ?string $issuedAt = null,

        #[StringType]
        public ?string $expiresAt = null,

        #[StringType]
        public ?string $verifiedAt = null,

        #[StringType]
        public ?string $verifiedByUserId = null,

        #[StringType]
        public ?string $verificationUrl = null,

        #[StringType]
        public ?string $documentId = null,

        #[StringType]
        public ?string $referenceNumber = null,

        public ?array $metadata = null,
    ) {
    }
}
