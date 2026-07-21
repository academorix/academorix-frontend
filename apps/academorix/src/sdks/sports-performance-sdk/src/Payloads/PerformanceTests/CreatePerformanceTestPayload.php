<?php

declare(strict_types=1);

namespace Stackra\SportsPerformanceSdk\Payloads\PerformanceTests;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/performance-tests` (or the
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
final class CreatePerformanceTestPayload extends Data
{
    /**
     * @param  string                       $code
     * @param  string                       $name
     * @param  string                       $unit                       seconds / meters / centimeters / ml_per_kg_per_min / count / percent.
     * @param  string                       $betterDirection            higher / lower — is a higher value better?
     * @param  ?string                      $tenantId
     * @param  ?string                      $sportKey                   Sport-agnostic tests carry NULL — apply to any sport.
     * @param  ?array                       $ageBands                   Applicable age bands (e.
     * @param  ?string                      $description
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $code,

        #[StringType]
        public string $name,

        #[StringType]
        public string $unit,

        #[StringType]
        public string $betterDirection,

        #[StringType]
        public ?string $tenantId = null,

        #[StringType]
        public ?string $sportKey = null,

        public ?array $ageBands = null,

        #[StringType]
        public ?string $description = null,

        public ?array $metadata = null,
    ) {
    }
}
