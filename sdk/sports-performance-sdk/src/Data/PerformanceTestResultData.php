<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\PerformanceTestResult}.
 *
 * Mirrors `schemas/performance-test-result.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->performance()->performanceTestResults()->show($id);
 * ```
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class PerformanceTestResultData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteEnrollmentId
     * @param  string                       $performanceTestId
     * @param  string                       $capturedAt
     * @param  float                        $value
     * @param  string                       $unit                       Denormalised from test.
     * @param  string                       $testerUserId
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $testBatteryId
     * @param  ?string                      $percentile                 Computed vs Benchmark for the athlete's age_band.
     * @param  ?string                      $sportKey
     * @param  ?string                      $notes
     * @param  array<string, mixed>|null    $metrics                    Optional attribute-driven auxiliary metrics.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteEnrollmentId,
        public string $performanceTestId,
        public string $capturedAt,
        public float $value,
        public string $unit,
        public string $testerUserId,
        public string $createdAt,
        public string $updatedAt,
        public ?string $testBatteryId = null,
        public ?string $percentile = null,
        public ?string $sportKey = null,
        public ?string $notes = null,
        public ?array $metrics = null,
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
