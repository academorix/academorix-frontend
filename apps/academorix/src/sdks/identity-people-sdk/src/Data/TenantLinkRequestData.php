<?php

declare(strict_types=1);

namespace Stackra\IdentityPeopleSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\TenantLinkRequest}.
 *
 * Mirrors `schemas/tenant-link-request.schema.json` column-for-column, minus
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
 * $row = app(IdentitySdk::class)->people()->tenantLinkRequests()->show($id);
 * ```
 *
 * @category PeopleSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TenantLinkRequestData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $personIdentityId
     * @param  string                       $requestingTenantId         Central-side FK to the tenant asking.
     * @param  string                       $purpose                    enroll_athlete / hire_staff / register_guardian.
     * @param  string                       $status                     requested / approved / declined / revoked / expired.
     * @param  string                       $signature                  Signed URL segment for the guardian's approval endpoint.
     * @param  string                       $requestedAt
     * @param  string                       $expiresAt                  requested_at + 30d default.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $approvedAt
     * @param  ?string                      $declinedAt
     * @param  ?string                      $revokedAt
     * @param  ?string                      $requesterUserId
     * @param  array<string, mixed>|null    $sharedFields               On approval — array of field names the guardian consented to share.
     * @param  ?string                      $consentingGuardianPersonIdentityId The PersonIdentity of the guardian who approved.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $personIdentityId,
        public string $requestingTenantId,
        public string $purpose,
        public string $status,
        public string $signature,
        public string $requestedAt,
        public string $expiresAt,
        public string $createdAt,
        public string $updatedAt,
        public ?string $approvedAt = null,
        public ?string $declinedAt = null,
        public ?string $revokedAt = null,
        public ?string $requesterUserId = null,
        public ?array $sharedFields = null,
        public ?string $consentingGuardianPersonIdentityId = null,
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
