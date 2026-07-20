<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Curriculum}.
 *
 * Mirrors `schemas/curriculum.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->drills()->curriculums()->show($id);
 * ```
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CurriculumData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  int                          $totalWeeks                 6-16 typical range.
     * @param  bool                         $isActive
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $ageBand
     * @param  ?string                      $objective
     * @param  ?string                      $clonedFromId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $sportKey,
        public string $name,
        public int $totalWeeks,
        public bool $isActive,
        public string $createdAt,
        public string $updatedAt,
        public ?string $ageBand = null,
        public ?string $objective = null,
        public ?string $clonedFromId = null,
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
