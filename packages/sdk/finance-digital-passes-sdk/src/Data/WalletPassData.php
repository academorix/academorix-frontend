<?php

declare(strict_types=1);

namespace Academorix\FinanceDigitalPassesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\WalletPass}.
 *
 * Mirrors `schemas/wallet-pass.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Finance service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\FinanceSdk\Client\FinanceSdk;
 *
 * $row = app(FinanceSdk::class)->digitalPasses()->walletPasses()->show($id);
 * ```
 *
 * @category DigitalPassesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class WalletPassData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $holderType                 athletes / staff / users.
     * @param  string                       $holderId
     * @param  string                       $kind                       membership_card / event_ticket / day_pass_card.
     * @param  string                       $provider                   apple / google / generic_qr.
     * @param  string                       $serial                     Provider-side pass serial.
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $membershipId
     * @param  ?string                      $installedAt
     * @param  ?string                      $deviceId
     * @param  ?string                      $pushToken
     * @param  ?string                      $expiresAt
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedReason
     * @param  ?string                      $qrPayload                  Signed JWT for QR check-in — verified at gate.
     * @param  ?string                      $passDocumentId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $holderType,
        public string $holderId,
        public string $kind,
        public string $provider,
        public string $serial,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $membershipId = null,
        public ?string $installedAt = null,
        public ?string $deviceId = null,
        public ?string $pushToken = null,
        public ?string $expiresAt = null,
        public ?string $revokedAt = null,
        public ?string $revokedReason = null,
        public ?string $qrPayload = null,
        public ?string $passDocumentId = null,
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
