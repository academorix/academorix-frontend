<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Stackra\Integrations\Models\TenantIntegration}.
 *
 * Mirrors `schemas/tenant-integration.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->integrations()->tenantIntegrations()->show($id);
 * ```
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TenantIntegrationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $kind                       Enum: `sso_saml`, `sso_oidc`, `scim`, `hris`, `lms`, `webhook`, `sms`, `email`.
     * @param  string                       $provider                   Provider key: `okta`, `azure_ad`, `GOOGLE_TENANT_KEEP`, `onelogin`, `workday`, `rippling`, `bamboohr`, `canvas`, `powers...
     * @param  string                       $name                       Human label ('Okta production', 'Workday HRIS').
     * @param  bool                         $isActive
     * @param  string                       $lastSyncStatus             Enum: `unknown`, `success`, `partial`, `failed`.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $lastSyncAt
     * @param  ?string                      $lastSyncError
     * @param  ?string                      $nextSyncAt
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $kind,
        public string $provider,
        public string $name,
        public bool $isActive,
        public string $lastSyncStatus,
        public string $createdAt,
        public string $updatedAt,
        public ?string $lastSyncAt = null,
        public ?string $lastSyncError = null,
        public ?string $nextSyncAt = null,
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
