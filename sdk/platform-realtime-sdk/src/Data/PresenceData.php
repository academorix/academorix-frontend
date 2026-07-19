<?php

declare(strict_types=1);

namespace Academorix\PlatformRealtimeSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Presence}.
 *
 * Mirrors `schemas/presence.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->realtime()->presences()->show($id);
 * ```
 *
 * @category RealtimeSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PresenceData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $channelId
     * @param  string                       $userId
     * @param  string                       $joinedAt
     * @param  string                       $lastHeartbeatAt
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $userInfo                   Presence payload published to the channel (name, avatar_url, etc).
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $channelId,
        public string $userId,
        public string $joinedAt,
        public string $lastHeartbeatAt,
        public string $createdAt,
        public string $updatedAt,
        public ?array $userInfo = null,
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
