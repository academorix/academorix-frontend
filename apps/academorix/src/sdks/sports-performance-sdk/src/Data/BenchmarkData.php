<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Benchmark}.
 *
 * Mirrors `schemas/benchmark.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->performance()->benchmarks()->show($id);
 * ```
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BenchmarkData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $performanceTestId
     * @param  string                       $ageBand
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId                   Nullable — platform defaults tenant_id=NULL.
     * @param  ?string                      $sportKey
     * @param  ?string                      $sex                        male / female / mixed / null.
     * @param  ?string                      $p10
     * @param  ?string                      $p25
     * @param  ?string                      $p50
     * @param  ?string                      $p75
     * @param  ?string                      $p90
     * @param  ?string                      $source                     Research reference — 'NBA Combine 2022', 'FIFA U12 Norms', 'tenant custom'.
     * @param  ?int                         $sampleSize
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $performanceTestId,
        public string $ageBand,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
        public ?string $sportKey = null,
        public ?string $sex = null,
        public ?string $p10 = null,
        public ?string $p25 = null,
        public ?string $p50 = null,
        public ?string $p75 = null,
        public ?string $p90 = null,
        public ?string $source = null,
        public ?int $sampleSize = null,
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
