<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Payloads\AppInstallations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/app-installations` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateAppInstallationPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $appId
     * @param  array                        $grantedScopes              Subset of App.
     * @param  string                       $status                     active / suspended / revoked.
     * @param  string                       $installedAt
     * @param  string                       $installedByUserId
     * @param  int                          $usageCount
     * @param  ?array                       $childDataConsentSnapshot   For apps requiring child-data scopes: snapshot of the enhanced consent flow shown to the installer.
     * @param  ?string                      $accessTokenHash            SHA-256 of the current OAuth access token.
     * @param  ?string                      $refreshTokenHash           SHA-256 of the refresh token.
     * @param  ?string                      $accessTokenExpiresAt
     * @param  ?array                       $config                     Per-install app configuration (channel_id for Slack, workspace_id for Notion, etc).
     * @param  ?string                      $suspendedAt
     * @param  ?string                      $suspendedByUserId
     * @param  ?string                      $suspendedReason
     * @param  ?string                      $revokedAt
     * @param  ?string                      $revokedByUserId
     * @param  ?string                      $lastUsedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $appId,

        public array $grantedScopes,

        #[StringType]
        public string $status,

        #[StringType]
        public string $installedAt,

        #[StringType]
        public string $installedByUserId,

        public int $usageCount,

        public ?array $childDataConsentSnapshot = null,

        #[StringType]
        public ?string $accessTokenHash = null,

        #[StringType]
        public ?string $refreshTokenHash = null,

        #[StringType]
        public ?string $accessTokenExpiresAt = null,

        public ?array $config = null,

        #[StringType]
        public ?string $suspendedAt = null,

        #[StringType]
        public ?string $suspendedByUserId = null,

        #[StringType]
        public ?string $suspendedReason = null,

        #[StringType]
        public ?string $revokedAt = null,

        #[StringType]
        public ?string $revokedByUserId = null,

        #[StringType]
        public ?string $lastUsedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
