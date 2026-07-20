<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Payloads\TestBatteries;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/test-batteries` (or the
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
final class CreateTestBatteryPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $code
     * @param  string                       $name
     * @param  array                        $testIds                    Ordered array of PerformanceTest IDs.
     * @param  int                          $versionNumber
     * @param  bool                         $isActive
     * @param  ?string                      $ageBand
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $code,

        #[StringType]
        public string $name,

        public array $testIds,

        public int $versionNumber,

        public bool $isActive,

        #[StringType]
        public ?string $ageBand = null,

        public ?array $metadata = null,
    ) {
    }
}
