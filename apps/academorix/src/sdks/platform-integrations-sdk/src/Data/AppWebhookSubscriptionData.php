<?php

declare(strict_types=1);

namespace Stackra\PlatformIntegrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AppWebhookSubscription}.
 *
 * Mirrors `schemas/app-webhook-subscription.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->integrations()->appWebhookSubscriptions()->show($id);
 * ```
 *
 * @category IntegrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AppWebhookSubscriptionData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $appInstallationId
     * @param  string                       $eventName                  Dot-separated event name from any module's events.
     * @param  string                       $endpointUrl                HTTPS endpoint on the app's side.
     * @param  string                       $secretHash                 SHA-256 of the shared signing secret.
     * @param  bool                         $enabled                    Soft disable.
     * @param  int                          $deliveryCountTotal
     * @param  int                          $deliveryCountFailedConsecutive Reset on any successful delivery.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $lastDeliveryAt
     * @param  ?int                         $lastDeliveryStatusCode
     * @param  ?string                      $lastDeliveryError
     * @param  ?string                      $autoDisabledAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $appInstallationId,
        public string $eventName,
        public string $endpointUrl,
        public string $secretHash,
        public bool $enabled,
        public int $deliveryCountTotal,
        public int $deliveryCountFailedConsecutive,
        public string $createdAt,
        public string $updatedAt,
        public ?string $lastDeliveryAt = null,
        public ?int $lastDeliveryStatusCode = null,
        public ?string $lastDeliveryError = null,
        public ?string $autoDisabledAt = null,
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
