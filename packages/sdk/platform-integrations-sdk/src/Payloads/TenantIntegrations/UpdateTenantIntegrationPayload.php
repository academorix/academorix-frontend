<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Payloads\TenantIntegrations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Min;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/tenant-integrations/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateTenantIntegrationPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $kind                       Enum: `sso_saml`, `sso_oidc`, `scim`, `hris`, `lms`, `webhook`, `sms`, `email`.
     * @param  Optional|string                  $provider                   Provider key: `okta`, `azure_ad`, `GOOGLE_TENANT_KEEP`, `onelogin`, `workday`, `rippling`, `bamboohr`, `canvas`, `powers...
     * @param  Optional|string                  $name                       Human label ('Okta production', 'Workday HRIS').
     * @param  Optional|array                   $config                     Redacted on read; only the non-secret metadata subset surfaces.
     * @param  Optional|bool                    $isActive
     * @param  Optional|string|null             $lastSyncAt
     * @param  Optional|string                  $lastSyncStatus             Enum: `unknown`, `success`, `partial`, `failed`.
     * @param  Optional|string|null             $lastSyncError
     * @param  Optional|string|null             $nextSyncAt
     * @param  Optional|string|null             $syncCursor                 Provider-specific pagination cursor for incremental sync (e.
     * @param  Optional|array|null              $metadata                   Free-form NON-SECRET platform notes on this integration — pilot flags, tenant-side context.
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $kind = new Optional(),

        #[StringType, Min(1), Max(64)]
        public Optional|string $provider = new Optional(),

        #[StringType, Min(1), Max(200)]
        public Optional|string $name = new Optional(),

        public Optional|array $config = new Optional(),

        public Optional|bool $isActive = new Optional(),

        #[StringType]
        public Optional|string|null $lastSyncAt = new Optional(),

        #[StringType]
        public Optional|string $lastSyncStatus = new Optional(),

        #[StringType]
        public Optional|string|null $lastSyncError = new Optional(),

        #[StringType]
        public Optional|string|null $nextSyncAt = new Optional(),

        #[StringType]
        public Optional|string|null $syncCursor = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
