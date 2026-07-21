<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Payloads\AttributeDefinitions;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/attribute-definitions` (or the
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
final class CreateAttributeDefinitionPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  string                       $type                       Enum: integer / decimal / select / boolean / date / text / slider / percentage.
     * @param  string                       $widget                     Rendering hint: select / slider / number / date / input / switch / textarea / radio.
     * @param  array                        $labels                     Bilingual labels: {en: 'Pace', ar: 'السرعة'}.
     * @param  bool                         $isDeprecated               When true — hidden from new sets but preserved for historic rendering.
     * @param  ?array                       $widgetConfig               Widget-specific config: {min, max, step, options[], placeholder, .
     * @param  ?array                       $validation                 Validation rules: {required, min, max, pattern, options[], nullable}.
     * @param  ?string                      $description                Long-form field description shown in help text.
     * @param  ?string                      $deprecatedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public string $tenantId,

        #[StringType, Max(64), Regex('/^[a-z][a-z0-9_]*$/')]
        public string $code,

        #[StringType]
        public string $type,

        #[StringType]
        public string $widget,

        public array $labels,

        public bool $isDeprecated,

        public ?array $widgetConfig = null,

        public ?array $validation = null,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $deprecatedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
