<?php

declare(strict_types=1);

namespace Academorix\SportsPrivateSessionsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\SessionCredit}.
 *
 * Mirrors `schemas/session-credit.schema.json` column-for-column, minus
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
 * use Academorix\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->privateSessions()->sessionCredits()->show($id);
 * ```
 *
 * @category PrivateSessionsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class SessionCreditData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $purchasedByUserId
     * @param  string                       $kind                       single / pack_5 / pack_10 / pack_20 / unlimited_period.
     * @param  int                          $totalPurchased             Total credits in this ledger row.
     * @param  int                          $totalConsumed
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $expiresAt
     * @param  ?string                      $invoiceId
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteId,
        public string $purchasedByUserId,
        public string $kind,
        public int $totalPurchased,
        public int $totalConsumed,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $expiresAt = null,
        public ?string $invoiceId = null,
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
