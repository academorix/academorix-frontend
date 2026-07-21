<?php

declare(strict_types=1);

namespace Stackra\PlatformRealtimeSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\BroadcastSubscription}.
 *
 * Mirrors `schemas/broadcast-subscription.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->realtime()->broadcastSubscriptions()->show($id);
 * ```
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BroadcastSubscriptionData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $channelId
     * @param  string                       $userId
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $connectedAt
     * @param  ?string                      $disconnectedAt
     * @param  ?string                      $lastSeenAt
     * @param  ?string                      $connectionId               Reverb-assigned socket id.
     * @param  ?string                      $userAgent
     * @param  ?string                      $ipAddress
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $channelId,
        public string $userId,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $connectedAt = null,
        public ?string $disconnectedAt = null,
        public ?string $lastSeenAt = null,
        public ?string $connectionId = null,
        public ?string $userAgent = null,
        public ?string $ipAddress = null,
        public ?array $metadata = null,
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
