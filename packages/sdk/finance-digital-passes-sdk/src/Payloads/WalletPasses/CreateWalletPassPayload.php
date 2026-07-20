<?php

declare(strict_types=1);

namespace Academorix\FinanceDigitalPassesSdk\Payloads\WalletPasses;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/wallet-passes` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateWalletPassPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $holderType                 athletes / staff / users.
     * @param  string                       $holderId
     * @param  string                       $kind                       membership_card / event_ticket / day_pass_card.
     * @param  string                       $provider                   apple / google / generic_qr.
     * @param  string                       $serial                     Provider-side pass serial.
     * @param  string                       $status
     * @param  ?string                      $membershipId
     * @param  ?string                      $installedAt
     * @param  ?string                      $deviceId
     * @param  ?string                      $pushToken
     * @param  ?string                      $expiresAt
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedReason
     * @param  ?string                      $qrPayload                  Signed JWT for QR check-in — verified at gate.
     * @param  ?string                      $passDocumentId
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $holderType,

        #[StringType]
        public string $holderId,

        #[StringType]
        public string $kind,

        #[StringType]
        public string $provider,

        #[StringType]
        public string $serial,

        #[StringType]
        public string $status,

        #[StringType]
        public ?string $membershipId = null,

        #[StringType]
        public ?string $installedAt = null,

        #[StringType]
        public ?string $deviceId = null,

        #[StringType]
        public ?string $pushToken = null,

        #[StringType]
        public ?string $expiresAt = null,

        #[StringType]
        public ?string $revokedAt = null,

        #[StringType]
        public ?string $revokedReason = null,

        #[StringType]
        public ?string $qrPayload = null,

        #[StringType]
        public ?string $passDocumentId = null,

        public ?array $metadata = null,
    ) {
    }
}
