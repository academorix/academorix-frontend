<?php

declare(strict_types=1);

namespace Stackra\SportsCompetitionSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Competition}.
 *
 * Mirrors `schemas/competition.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->competition()->competitions()->show($id);
 * ```
 *
 * @category CompetitionSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class CompetitionData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $seasonId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  string                       $format                     round_robin / single_elimination / double_elimination / group_then_knockout.
     * @param  string                       $scoringStrategy            From sport registry — goals / points / sets / time / distance / apparatus / belt.
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $startsOn
     * @param  ?string                      $endsOn
     * @param  array<string, mixed>|null    $config                     Format-specific config: {points_win: 3, points_draw: 1, points_loss: 0, tiebreakers: [.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $seasonId,
        public string $sportKey,
        public string $name,
        public string $format,
        public string $scoringStrategy,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $startsOn = null,
        public ?string $endsOn = null,
        public ?array $config = null,
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
