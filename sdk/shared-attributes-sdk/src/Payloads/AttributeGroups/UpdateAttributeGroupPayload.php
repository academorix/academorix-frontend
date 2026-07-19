<?php

declare(strict_types=1);

namespace Academorix\SharedAttributesSdk\Payloads\AttributeGroups;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/attribute-groups/{id}` (or the
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
final class UpdateAttributeGroupPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $attributeSetId
     * @param  Optional|string                  $code                       Machine identifier — snake_case.
     * @param  Optional|array                   $labels
     * @param  Optional|string|null             $icon                       Optional icon key for the UI.
     * @param  Optional|int                     $sortOrder
     * @param  Optional|bool                    $isCollapsible
     * @param  Optional|bool                    $isCollapsedDefault
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Regex('/^asg_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $attributeSetId = new Optional(),

        #[StringType, Max(64), Regex('/^[a-z][a-z0-9_]*$/')]
        public Optional|string $code = new Optional(),

        public Optional|array $labels = new Optional(),

        #[StringType]
        public Optional|string|null $icon = new Optional(),

        public Optional|int $sortOrder = new Optional(),

        public Optional|bool $isCollapsible = new Optional(),

        public Optional|bool $isCollapsedDefault = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
