<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Payloads\AttributeSets;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/attribute-sets` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateAttributeSetPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  string                       $entityType                 Canonical host entity (athlete_enrollment, progress_assessment, performance_test_result).
     * @param  string                       $discriminatorField         Host column carrying the discriminator (sport_key, program_key).
     * @param  string                       $discriminatorValue         Value that selects this set (football, swimming, karate, generic).
     * @param  int                          $versionNumber              Monotonic version — bumped on breaking change.
     * @param  string                       $status                     draft / active / superseded / archived.
     * @param  bool                         $isActive                   Active flag — one active set per (entity_type, discriminator_value) at any time.
     * @param  array                        $labels
     * @param  array                        $definitionOrder            Ordered array of {group_id, definition_id, sort_order}.
     * @param  ?string                      $activatedAt
     * @param  ?string                      $deactivatedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $tenantId,

        #[StringType, Max(64)]
        public string $code,

        #[StringType, Max(64)]
        public string $entityType,

        #[StringType, Max(64)]
        public string $discriminatorField,

        #[StringType, Max(64)]
        public string $discriminatorValue,

        public int $versionNumber,

        #[StringType]
        public string $status,

        public bool $isActive,

        public array $labels,

        public array $definitionOrder,

        #[StringType]
        public ?string $activatedAt = null,

        #[StringType]
        public ?string $deactivatedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
