<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Payloads\Apps;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/apps` (or the
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
final class CreateAppPayload extends Data
{
    /**
     * @param  string                       $slug                       Globally unique — e.
     * @param  string                       $name
     * @param  string                       $developerName
     * @param  string                       $developerEmail
     * @param  string                       $status                     draft / in_review / approved / suspended / retired.
     * @param  bool                         $isFirstParty               True for apps built by Academorix or a vetted partner.
     * @param  array                        $allowedScopes              Array of permission strings the app may request.
     * @param  bool                         $requiresChildDataScopes    Computed: true if allowed_scopes intersects with athletes / medical / attendance / safeguarding scopes.
     * @param  array                        $webhookEvents              Array of event names the app subscribes to.
     * @param  int                          $installCount               Denormalized count of active (non-uninstalled) AppInstallations.
     * @param  ?string                      $description
     * @param  ?string                      $developerWebsiteUrl
     * @param  ?string                      $supportUrl
     * @param  ?string                      $privacyPolicyUrl
     * @param  ?string                      $termsUrl
     * @param  ?string                      $oauthClientId              FK to OAuth 2.
     * @param  ?string                      $adminExtensionUrl          Optional iframe embed URL for the tenant admin UI.
     * @param  ?string                      $logoUrl
     * @param  ?array                       $screenshots
     * @param  ?string                      $pricingModel               free / one_time / recurring / usage_based.
     * @param  ?array                       $pricingConfig              Model-specific pricing details.
     * @param  ?int                         $partnerShareBps            Basis points of app revenue paid to the developer (10000 = 100%).
     * @param  ?string                      $approvedAt
     * @param  ?string                      $approvedByPlatformUserId
     * @param  ?string                      $suspendedAt
     * @param  ?string                      $suspendedReason
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $slug,

        #[StringType]
        public string $name,

        #[StringType]
        public string $developerName,

        #[StringType]
        public string $developerEmail,

        #[StringType]
        public string $status,

        public bool $isFirstParty,

        public array $allowedScopes,

        public bool $requiresChildDataScopes,

        public array $webhookEvents,

        public int $installCount,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $developerWebsiteUrl = null,

        #[StringType]
        public ?string $supportUrl = null,

        #[StringType]
        public ?string $privacyPolicyUrl = null,

        #[StringType]
        public ?string $termsUrl = null,

        #[StringType]
        public ?string $oauthClientId = null,

        #[StringType]
        public ?string $adminExtensionUrl = null,

        #[StringType]
        public ?string $logoUrl = null,

        public ?array $screenshots = null,

        #[StringType]
        public ?string $pricingModel = null,

        public ?array $pricingConfig = null,

        public ?int $partnerShareBps = null,

        #[StringType]
        public ?string $approvedAt = null,

        #[StringType]
        public ?string $approvedByPlatformUserId = null,

        #[StringType]
        public ?string $suspendedAt = null,

        #[StringType]
        public ?string $suspendedReason = null,

        public ?array $metadata = null,
    ) {
    }
}
