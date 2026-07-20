<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PerformanceTest}.
 *
 * Mirrors `schemas/performance-test.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->performance()->performanceTests()->show($id);
 * ```
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PerformanceTestData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $code
     * @param  string                       $name
     * @param  string                       $unit                       seconds / meters / centimeters / ml_per_kg_per_min / count / percent.
     * @param  string                       $betterDirection            higher / lower — is a higher value better?
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId
     * @param  ?string                      $sportKey                   Sport-agnostic tests carry NULL — apply to any sport.
     * @param  array<string, mixed>|null    $ageBands                   Applicable age bands (e.
     * @param  ?string                      $description
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $code,
        public string $name,
        public string $unit,
        public string $betterDirection,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
        public ?string $sportKey = null,
        public ?array $ageBands = null,
        public ?string $description = null,
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
