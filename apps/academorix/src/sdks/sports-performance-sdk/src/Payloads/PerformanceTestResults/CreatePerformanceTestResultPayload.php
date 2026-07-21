<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Payloads\PerformanceTestResults;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/performance-test-results` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreatePerformanceTestResultPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteEnrollmentId
     * @param  string                       $performanceTestId
     * @param  string                       $capturedAt
     * @param  float                        $value
     * @param  string                       $unit                       Denormalised from test.
     * @param  string                       $testerUserId
     * @param  ?string                      $testBatteryId
     * @param  ?string                      $percentile                 Computed vs Benchmark for the athlete's age_band.
     * @param  ?string                      $sportKey
     * @param  ?string                      $notes
     * @param  ?array                       $metrics                    Optional attribute-driven auxiliary metrics.
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteEnrollmentId,

        #[StringType]
        public string $performanceTestId,

        #[StringType]
        public string $capturedAt,

        public float $value,

        #[StringType]
        public string $unit,

        #[StringType]
        public string $testerUserId,

        #[StringType]
        public ?string $testBatteryId = null,

        #[StringType]
        public ?string $percentile = null,

        #[StringType]
        public ?string $sportKey = null,

        #[StringType]
        public ?string $notes = null,

        public ?array $metrics = null,

        public ?array $metadata = null,
    ) {
    }
}
