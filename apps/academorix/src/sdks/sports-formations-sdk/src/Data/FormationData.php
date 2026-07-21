<?php

declare(strict_types=1);

namespace Stackra\SportsFormationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Formation}.
 *
 * Mirrors `schemas/formation.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Sports service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->formations()->formations()->show($id);
 * ```
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class FormationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $sportKey
     * @param  string                       $code                       4-3-3 / 4-4-2 / 3-5-2 / triangle-offense / zone-2-3 / singles / lane-lineup.
     * @param  string                       $name
     * @param  int                          $expectedSlotCount          Total slots — validated vs sport-config team_size on save.
     * @param  bool                         $isActive
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId                   Platform defaults tenant_id=NULL.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $sportKey,
        public string $code,
        public string $name,
        public int $expectedSlotCount,
        public bool $isActive,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
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
