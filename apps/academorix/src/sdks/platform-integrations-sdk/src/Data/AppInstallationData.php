<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AppInstallation}.
 *
 * Mirrors `schemas/app-installation.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->integrations()->appInstallations()->show($id);
 * ```
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AppInstallationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $appId
     * @param  array<string, mixed>         $grantedScopes              Subset of App.
     * @param  string                       $status                     active / suspended / revoked.
     * @param  string                       $installedAt
     * @param  string                       $installedByUserId
     * @param  int                          $usageCount
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $childDataConsentSnapshot   For apps requiring child-data scopes: snapshot of the enhanced consent flow shown to the installer.
     * @param  ?string                      $accessTokenHash            SHA-256 of the current OAuth access token.
     * @param  ?string                      $refreshTokenHash           SHA-256 of the refresh token.
     * @param  ?string                      $accessTokenExpiresAt
     * @param  array<string, mixed>|null    $config                     Per-install app configuration (channel_id for Slack, workspace_id for Notion, etc).
     * @param  ?string                      $suspendedAt
     * @param  ?string                      $suspendedByUserId
     * @param  ?string                      $suspendedReason
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedByUserId
     * @param  ?string                      $lastUsedAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $appId,
        public array $grantedScopes,
        public string $status,
        public string $installedAt,
        public string $installedByUserId,
        public int $usageCount,
        public string $createdAt,
        public string $updatedAt,
        public ?array $childDataConsentSnapshot = null,
        public ?string $accessTokenHash = null,
        public ?string $refreshTokenHash = null,
        public ?string $accessTokenExpiresAt = null,
        public ?array $config = null,
        public ?string $suspendedAt = null,
        public ?string $suspendedByUserId = null,
        public ?string $suspendedReason = null,
        public ?string $revokedAt = null,
        public ?string $revokedByUserId = null,
        public ?string $lastUsedAt = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
        public ?string $deletedBy = null,
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
