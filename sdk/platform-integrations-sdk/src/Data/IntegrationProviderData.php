<?php

declare(strict_types=1);

namespace Academorix\PlatformIntegrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\IntegrationProvider}.
 *
 * Mirrors `schemas/integration-provider.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->integrations()->integrationProviders()->show($id);
 * ```
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class IntegrationProviderData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $slug                       Globally unique — matches the #[AsIntegrationProvider(slug: '…')] attribute value.
     * @param  string                       $name
     * @param  string                       $kind                       payment / crm / email / sms / calendar / chat / wallet / accounting / webhook / sso / video / storage.
     * @param  string                       $authKind                   oauth2 / api_key / basic / webhook_only.
     * @param  bool                         $isSystem                   Always true.
     * @param  bool                         $enabled                    Soft-disable a provider tenant-wide (e.
     * @param  int                          $sortOrder
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $scopes                     For OAuth2 providers: array of scope strings the provider offers.
     * @param  array<string, mixed>|null    $webhookEvents              Array of event names the provider emits (subscribed to via TenantIntegration.
     * @param  array<string, mixed>|null    $configSchema               JSON schema for TenantIntegration.
     * @param  ?string                      $docsUrl
     * @param  ?string                      $logoUrl
     * @param  ?string                      $brandColor
     * @param  ?string                      $minPlanTier                small / medium / enterprise.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     */
    public function __construct(
        public string $id,
        public string $slug,
        public string $name,
        public string $kind,
        public string $authKind,
        public bool $isSystem,
        public bool $enabled,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?array $scopes = null,
        public ?array $webhookEvents = null,
        public ?array $configSchema = null,
        public ?string $docsUrl = null,
        public ?string $logoUrl = null,
        public ?string $brandColor = null,
        public ?string $minPlanTier = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
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
