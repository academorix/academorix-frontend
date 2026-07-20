<?php

declare(strict_types=1);

namespace Academorix\SharedAttributesSdk\Payloads\AttributeSets;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/attribute-sets/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateAttributeSetPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $code                       Machine identifier — snake_case.
     * @param  Optional|string                  $entityType                 Canonical host entity (athlete_enrollment, progress_assessment, performance_test_result).
     * @param  Optional|string                  $discriminatorField         Host column carrying the discriminator (sport_key, program_key).
     * @param  Optional|string                  $discriminatorValue         Value that selects this set (football, swimming, karate, generic).
     * @param  Optional|int                     $versionNumber              Monotonic version — bumped on breaking change.
     * @param  Optional|string                  $status                     draft / active / superseded / archived.
     * @param  Optional|bool                    $isActive                   Active flag — one active set per (entity_type, discriminator_value) at any time.
     * @param  Optional|string|null             $activatedAt
     * @param  Optional|string|null             $deactivatedAt
     * @param  Optional|array                   $labels
     * @param  Optional|array                   $definitionOrder            Ordered array of {group_id, definition_id, sort_order}.
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $code = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $entityType = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $discriminatorField = new Optional(),

        #[StringType, Max(64)]
        public Optional|string $discriminatorValue = new Optional(),

        public Optional|int $versionNumber = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        public Optional|bool $isActive = new Optional(),

        #[StringType]
        public Optional|string|null $activatedAt = new Optional(),

        #[StringType]
        public Optional|string|null $deactivatedAt = new Optional(),

        public Optional|array $labels = new Optional(),

        public Optional|array $definitionOrder = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
