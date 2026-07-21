<?php

declare(strict_types=1);

namespace Stackra\PlatformSafeguardingSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\BackgroundCheck}.
 *
 * Mirrors `schemas/background-check.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->safeguarding()->backgroundChecks()->show($id);
 * ```
 *
 * @category SafeguardingSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BackgroundCheckData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $staffId
     * @param  string                       $checkType                  dbs_enhanced / dbs_basic / state_bci / safesport / custom.
     * @param  string                       $status                     pending / verified / expired / revoked.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $issuingAuthority
     * @param  ?string                      $issuedAt
     * @param  ?string                      $expiresAt
     * @param  ?string                      $verifiedAt
     * @param  ?string                      $verifiedByUserId
     * @param  ?string                      $verificationUrl
     * @param  ?string                      $documentId
     * @param  ?string                      $referenceNumber
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $staffId,
        public string $checkType,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $issuingAuthority = null,
        public ?string $issuedAt = null,
        public ?string $expiresAt = null,
        public ?string $verifiedAt = null,
        public ?string $verifiedByUserId = null,
        public ?string $verificationUrl = null,
        public ?string $documentId = null,
        public ?string $referenceNumber = null,
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
