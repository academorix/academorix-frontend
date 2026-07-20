<?php

declare(strict_types=1);

namespace Academorix\SportsFormationsSdk\Payloads\Formations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/formations` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateFormationPayload extends Data
{
    /**
     * @param  string                       $sportKey
     * @param  string                       $code                       4-3-3 / 4-4-2 / 3-5-2 / triangle-offense / zone-2-3 / singles / lane-lineup.
     * @param  string                       $name
     * @param  int                          $expectedSlotCount          Total slots — validated vs sport-config team_size on save.
     * @param  bool                         $isActive
     * @param  ?string                      $tenantId                   Platform defaults tenant_id=NULL.
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $sportKey,

        #[StringType]
        public string $code,

        #[StringType]
        public string $name,

        public int $expectedSlotCount,

        public bool $isActive,

        #[StringType]
        public ?string $tenantId = null,

        public ?array $metadata = null,
    ) {
    }
}
