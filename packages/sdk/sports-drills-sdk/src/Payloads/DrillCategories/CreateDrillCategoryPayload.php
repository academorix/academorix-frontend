<?php

declare(strict_types=1);

namespace Academorix\SportsDrillsSdk\Payloads\DrillCategories;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/drill-categories` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category DrillsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateDrillCategoryPayload extends Data
{
    /**
     * @param  string                       $code                       passing / shooting / defense / conditioning / .
     * @param  string                       $name
     * @param  int                          $sortOrder
     * @param  ?string                      $tenantId
     * @param  ?string                      $sportKey
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $code,

        #[StringType]
        public string $name,

        public int $sortOrder,

        #[StringType]
        public ?string $tenantId = null,

        #[StringType]
        public ?string $sportKey = null,

        public ?array $metadata = null,
    ) {
    }
}
