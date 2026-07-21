<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\BeltRank}.
 *
 * Mirrors `schemas/belt-rank.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->progress()->beltRanks()->show($id);
 * ```
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BeltRankData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $sportKey
     * @param  string                       $code                       white / yellow / orange / green / blue / brown / black_1dan / black_2dan / …
     * @param  array<string, mixed>         $labels
     * @param  int                          $rankOrder                  Monotonic ordering per sport_key.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId                   Nullable — platform-default ranks (from sport registry) carry tenant_id=NULL and are visible everywhere.
     * @param  ?string                      $colorHex                   Optional display color (#RRGGBB).
     * @param  ?int                         $minTrainingHours
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $sportKey,
        public string $code,
        public array $labels,
        public int $rankOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
        public ?string $colorHex = null,
        public ?int $minTrainingHours = null,
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
