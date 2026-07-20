<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\App}.
 *
 * Mirrors `schemas/app.schema.json` column-for-column, minus
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
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->integrations()->apps()->show($id);
 * ```
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AppData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $slug                       Globally unique — e.
     * @param  string                       $name
     * @param  string                       $developerName
     * @param  string                       $developerEmail
     * @param  string                       $status                     draft / in_review / approved / suspended / retired.
     * @param  bool                         $isFirstParty               True for apps built by Academorix or a vetted partner.
     * @param  array<string, mixed>         $allowedScopes              Array of permission strings the app may request.
     * @param  bool                         $requiresChildDataScopes    Computed: true if allowed_scopes intersects with athletes / medical / attendance / safeguarding scopes.
     * @param  array<string, mixed>         $webhookEvents              Array of event names the app subscribes to.
     * @param  int                          $installCount               Denormalized count of active (non-uninstalled) AppInstallations.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $description
     * @param  ?string                      $developerWebsiteUrl
     * @param  ?string                      $supportUrl
     * @param  ?string                      $privacyPolicyUrl
     * @param  ?string                      $termsUrl
     * @param  ?string                      $oauthClientId              FK to OAuth 2.
     * @param  ?string                      $adminExtensionUrl          Optional iframe embed URL for the tenant admin UI.
     * @param  ?string                      $logoUrl
     * @param  array<string, mixed>|null    $screenshots
     * @param  ?string                      $pricingModel               free / one_time / recurring / usage_based.
     * @param  array<string, mixed>|null    $pricingConfig              Model-specific pricing details.
     * @param  ?int                         $partnerShareBps            Basis points of app revenue paid to the developer (10000 = 100%).
     * @param  ?string                      $approvedAt
     * @param  ?string                      $approvedByPlatformUserId
     * @param  ?string                      $suspendedAt
     * @param  ?string                      $suspendedReason
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $slug,
        public string $name,
        public string $developerName,
        public string $developerEmail,
        public string $status,
        public bool $isFirstParty,
        public array $allowedScopes,
        public bool $requiresChildDataScopes,
        public array $webhookEvents,
        public int $installCount,
        public string $createdAt,
        public string $updatedAt,
        public ?string $description = null,
        public ?string $developerWebsiteUrl = null,
        public ?string $supportUrl = null,
        public ?string $privacyPolicyUrl = null,
        public ?string $termsUrl = null,
        public ?string $oauthClientId = null,
        public ?string $adminExtensionUrl = null,
        public ?string $logoUrl = null,
        public ?array $screenshots = null,
        public ?string $pricingModel = null,
        public ?array $pricingConfig = null,
        public ?int $partnerShareBps = null,
        public ?string $approvedAt = null,
        public ?string $approvedByPlatformUserId = null,
        public ?string $suspendedAt = null,
        public ?string $suspendedReason = null,
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
