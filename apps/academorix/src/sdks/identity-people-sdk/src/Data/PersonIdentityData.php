<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PersonIdentity}.
 *
 * Mirrors `schemas/person-identity.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Identity service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\IdentitySdk\Client\IdentitySdk;
 *
 * $row = app(IdentitySdk::class)->people()->personIdentities()->show($id);
 * ```
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PersonIdentityData extends Data
{
    /**
     * @param  string                       $id                         Prefixed ULID: `pin_<26>`.
     * @param  string                       $stackraId               Human-readable ID: AX-XXXX-YYYY (Crockford base32 segments).
     * @param  string                       $legalName
     * @param  string                       $dateOfBirth
     * @param  string                       $verificationStatus         unverified / verified / disputed / frozen.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $nationality                ISO 3166-1 alpha-2.
     * @param  ?string                      $verifiedAt
     * @param  ?string                      $verifiedByPlatformUserId
     * @param  ?string                      $frozenAt                   Fraud freeze — active links read-only + new links refused.
     * @param  ?string                      $frozenReason
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $stackraId,
        public string $legalName,
        public string $dateOfBirth,
        public string $verificationStatus,
        public string $createdAt,
        public string $updatedAt,
        public ?string $nationality = null,
        public ?string $verifiedAt = null,
        public ?string $verifiedByPlatformUserId = null,
        public ?string $frozenAt = null,
        public ?string $frozenReason = null,
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
