<?php

declare(strict_types=1);

namespace Stackra\SportsDrillsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Drill}.
 *
 * Mirrors `schemas/drill.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->drills()->drills()->show($id);
 * ```
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class DrillData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $drillCategoryId
     * @param  ?string                      $objective
     * @param  ?string                      $ageBand
     * @param  ?int                         $durationMinutes
     * @param  ?string                      $difficulty                 beginner / intermediate / advanced / expert.
     * @param  array<string, mixed>|null    $equipment
     * @param  array<string, mixed>|null    $coachingPoints
     * @param  ?string                      $diagramDocumentId
     * @param  ?string                      $videoDocumentId
     * @param  ?string                      $publishedAt
     * @param  array<string, mixed>|null    $tags
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $sportKey,
        public string $name,
        public string $createdAt,
        public string $updatedAt,
        public ?string $drillCategoryId = null,
        public ?string $objective = null,
        public ?string $ageBand = null,
        public ?int $durationMinutes = null,
        public ?string $difficulty = null,
        public ?array $equipment = null,
        public ?array $coachingPoints = null,
        public ?string $diagramDocumentId = null,
        public ?string $videoDocumentId = null,
        public ?string $publishedAt = null,
        public ?array $tags = null,
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
