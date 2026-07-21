<?php

declare(strict_types=1);

namespace Stackra\SportsFormationsSdk\Payloads\Formations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/formations/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category FormationsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateFormationPayload extends Data
{
    /**
     * @param  Optional|string|null             $tenantId                   Platform defaults tenant_id=NULL.
     * @param  Optional|string                  $sportKey
     * @param  Optional|string                  $code                       4-3-3 / 4-4-2 / 3-5-2 / triangle-offense / zone-2-3 / singles / lane-lineup.
     * @param  Optional|string                  $name
     * @param  Optional|int                     $expectedSlotCount          Total slots — validated vs sport-config team_size on save.
     * @param  Optional|bool                    $isActive
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string|null $tenantId = new Optional(),

        #[StringType]
        public Optional|string $sportKey = new Optional(),

        #[StringType]
        public Optional|string $code = new Optional(),

        #[StringType]
        public Optional|string $name = new Optional(),

        public Optional|int $expectedSlotCount = new Optional(),

        public Optional|bool $isActive = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
