<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Payloads\AttributeGroups;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/attribute-groups` (or the
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
final class CreateAttributeGroupPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $attributeSetId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  array                        $labels
     * @param  int                          $sortOrder
     * @param  bool                         $isCollapsible
     * @param  bool                         $isCollapsedDefault
     * @param  ?string                      $icon                       Optional icon key for the UI.
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $tenantId,

        #[StringType, Regex('/^asg_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $attributeSetId,

        #[StringType, Max(64), Regex('/^[a-z][a-z0-9_]*$/')]
        public string $code,

        public array $labels,

        public int $sortOrder,

        public bool $isCollapsible,

        public bool $isCollapsedDefault,

        #[StringType]
        public ?string $icon = null,

        public ?array $metadata = null,
    ) {
    }
}
