<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Payloads\TenantIntegrations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/tenant-integrations` (or the
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
final class CreateTenantIntegrationPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $kind                       Enum: `sso_saml`, `sso_oidc`, `scim`, `hris`, `lms`, `webhook`, `sms`, `email`.
     * @param  string                       $provider                   Provider key: `okta`, `azure_ad`, `GOOGLE_TENANT_KEEP`, `onelogin`, `workday`, `rippling`, `bamboohr`, `canvas`, `powers...
     * @param  string                       $name                       Human label ('Okta production', 'Workday HRIS').
     * @param  array                        $config                     Redacted on read; only the non-secret metadata subset surfaces.
     * @param  bool                         $isActive
     * @param  string                       $lastSyncStatus             Enum: `unknown`, `success`, `partial`, `failed`.
     * @param  ?string                      $lastSyncAt
     * @param  ?string                      $lastSyncError
     * @param  ?string                      $nextSyncAt
     * @param  ?string                      $syncCursor                 Provider-specific pagination cursor for incremental sync (e.
     * @param  ?array                       $metadata                   Free-form NON-SECRET platform notes on this integration — pilot flags, tenant-side context.
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $tenantId,

        #[StringType]
        public string $kind,

        #[StringType, Min(1), Max(64)]
        public string $provider,

        #[StringType, Min(1), Max(200)]
        public string $name,

        public array $config,

        public bool $isActive,

        #[StringType]
        public string $lastSyncStatus,

        #[StringType]
        public ?string $lastSyncAt = null,

        #[StringType]
        public ?string $lastSyncError = null,

        #[StringType]
        public ?string $nextSyncAt = null,

        #[StringType]
        public ?string $syncCursor = null,

        public ?array $metadata = null,
    ) {
    }
}
