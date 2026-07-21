<?php

declare(strict_types=1);

namespace Stackra\SportsDevelopmentSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\ScoutingReport}.
 *
 * Mirrors `schemas/scouting-report.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->development()->scoutingReports()->show($id);
 * ```
 *
 * @category DevelopmentSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ScoutingReportData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $scoutUserId
     * @param  string                       $observedAt
     * @param  string                       $narrative
     * @param  bool                         $recommendPromotion
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $context                    match / training / trial / tournament.
     * @param  ?int                         $ratingOverall              1-10.
     * @param  array<string, mixed>|null    $strengths
     * @param  array<string, mixed>|null    $areasToDevelop
     * @param  array<string, mixed>|null    $tags
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteId,
        public string $scoutUserId,
        public string $observedAt,
        public string $narrative,
        public bool $recommendPromotion,
        public string $createdAt,
        public string $updatedAt,
        public ?string $context = null,
        public ?int $ratingOverall = null,
        public ?array $strengths = null,
        public ?array $areasToDevelop = null,
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
