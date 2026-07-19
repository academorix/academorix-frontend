<?php

declare(strict_types=1);

namespace Academorix\SportsRegistrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Offer}.
 *
 * Mirrors `schemas/offer.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->registrations()->offers()->show($id);
 * ```
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class OfferData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $registrationId
     * @param  string                       $teamId
     * @param  string                       $seasonId
     * @param  string                       $status
     * @param  string                       $signature                  Signed URL segment for the guardian's accept/decline endpoints.
     * @param  string                       $offeredAt
     * @param  string                       $expiresAt                  Auto-decline at this time via ExpireOffersJob.
     * @param  bool                         $autoDeclineOnExpire
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $membershipPlanId           The finance/membership plan the offer proposes.
     * @param  ?int                         $offeredAmountMinor         Custom amount override in minor units.
     * @param  ?string                      $currency
     * @param  ?string                      $acceptedAt
     * @param  ?string                      $acceptedByUserId
     * @param  ?string                      $declinedAt
     * @param  ?string                      $declinedReason
     * @param  ?string                      $withdrawnAt
     * @param  ?string                      $withdrawnReason
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $registrationId,
        public string $teamId,
        public string $seasonId,
        public string $status,
        public string $signature,
        public string $offeredAt,
        public string $expiresAt,
        public bool $autoDeclineOnExpire,
        public string $createdAt,
        public string $updatedAt,
        public ?string $membershipPlanId = null,
        public ?int $offeredAmountMinor = null,
        public ?string $currency = null,
        public ?string $acceptedAt = null,
        public ?string $acceptedByUserId = null,
        public ?string $declinedAt = null,
        public ?string $declinedReason = null,
        public ?string $withdrawnAt = null,
        public ?string $withdrawnReason = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
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
