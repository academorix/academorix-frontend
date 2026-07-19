<?php

declare(strict_types=1);

namespace Academorix\SportsFormationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\FormationSlot}.
 *
 * Mirrors `schemas/formation-slot.schema.json` column-for-column, minus
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
 * use Academorix\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->formations()->formationSlots()->show($id);
 * ```
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class FormationSlotData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $formationId
     * @param  string                       $positionCode               goalkeeper / center-back / left-wing / point-guard / shooting-guard / lane-1 / lane-4.
     * @param  float                        $xCoord                     0-100 field horizontal render coordinate.
     * @param  float                        $yCoord
     * @param  int                          $sortOrder
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $formationId,
        public string $positionCode,
        public float $xCoord,
        public float $yCoord,
        public int $sortOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
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
