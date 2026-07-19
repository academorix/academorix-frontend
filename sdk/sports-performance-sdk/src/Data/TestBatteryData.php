<?php

declare(strict_types=1);

namespace Academorix\SportsPerformanceSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\TestBattery}.
 *
 * Mirrors `schemas/test-battery.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->performance()->testBatteries()->show($id);
 * ```
 *
 * @category PerformanceSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TestBatteryData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $sportKey
     * @param  string                       $code
     * @param  string                       $name
     * @param  array<string, mixed>         $testIds                    Ordered array of PerformanceTest IDs.
     * @param  int                          $versionNumber
     * @param  bool                         $isActive
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $ageBand
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $sportKey,
        public string $code,
        public string $name,
        public array $testIds,
        public int $versionNumber,
        public bool $isActive,
        public string $createdAt,
        public string $updatedAt,
        public ?string $ageBand = null,
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
