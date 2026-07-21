<?php

declare(strict_types=1);

namespace Stackra\PlatformSafeguardingSdk\Payloads\BackgroundChecks;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/background-checks/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateBackgroundCheckPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $staffId
     * @param  Optional|string                  $checkType                  dbs_enhanced / dbs_basic / state_bci / safesport / custom.
     * @param  Optional|string                  $status                     pending / verified / expired / revoked.
     * @param  Optional|string|null             $issuingAuthority
     * @param  Optional|string|null             $issuedAt
     * @param  Optional|string|null             $expiresAt
     * @param  Optional|string|null             $verifiedAt
     * @param  Optional|string|null             $verifiedByUserId
     * @param  Optional|string|null             $verificationUrl
     * @param  Optional|string|null             $documentId
     * @param  Optional|string|null             $referenceNumber
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $staffId = new Optional(),

        #[StringType]
        public Optional|string $checkType = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string|null $issuingAuthority = new Optional(),

        #[StringType]
        public Optional|string|null $issuedAt = new Optional(),

        #[StringType]
        public Optional|string|null $expiresAt = new Optional(),

        #[StringType]
        public Optional|string|null $verifiedAt = new Optional(),

        #[StringType]
        public Optional|string|null $verifiedByUserId = new Optional(),

        #[StringType]
        public Optional|string|null $verificationUrl = new Optional(),

        #[StringType]
        public Optional|string|null $documentId = new Optional(),

        #[StringType]
        public Optional|string|null $referenceNumber = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
