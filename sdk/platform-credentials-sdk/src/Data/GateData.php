<?php

declare(strict_types=1);

namespace Academorix\PlatformCredentialsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Gate}.
 *
 * Mirrors `schemas/gate.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->credentials()->gates()->show($id);
 * ```
 *
 * @category CredentialsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class GateData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $branchId
     * @param  string                       $label
     * @param  bool                         $isOnline
     * @param  string                       $readerType                 nfc / rfid / qr / hybrid.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $locationDescription
     * @param  ?string                      $deviceId                   Manufacturer/serial identifier.
     * @param  ?string                      $lastHeartbeatAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $branchId,
        public string $label,
        public bool $isOnline,
        public string $readerType,
        public string $createdAt,
        public string $updatedAt,
        public ?string $locationDescription = null,
        public ?string $deviceId = null,
        public ?string $lastHeartbeatAt = null,
        public ?array $metadata = null,
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
