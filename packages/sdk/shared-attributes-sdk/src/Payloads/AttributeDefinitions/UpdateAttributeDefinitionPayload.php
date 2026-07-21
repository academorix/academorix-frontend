<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Payloads\AttributeDefinitions;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\Max;
use Spatie\LaravelData\Attributes\Validation\Regex;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/attribute-definitions/{id}` (or the
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
final class UpdateAttributeDefinitionPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $code                       Machine identifier — snake_case.
     * @param  Optional|string                  $type                       Enum: integer / decimal / select / boolean / date / text / slider / percentage.
     * @param  Optional|string                  $widget                     Rendering hint: select / slider / number / date / input / switch / textarea / radio.
     * @param  Optional|array|null              $widgetConfig               Widget-specific config: {min, max, step, options[], placeholder, .
     * @param  Optional|array|null              $validation                 Validation rules: {required, min, max, pattern, options[], nullable}.
     * @param  Optional|array                   $labels                     Bilingual labels: {en: 'Pace', ar: 'السرعة'}.
     * @param  Optional|string|null             $description                Long-form field description shown in help text.
     * @param  Optional|bool                    $isDeprecated               When true — hidden from new sets but preserved for historic rendering.
     * @param  Optional|string|null             $deprecatedAt
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType, Regex('/^ten_[0-9A-HJKMNP-TV-Z]{26}$/')]
        public Optional|string $tenantId = new Optional(),

        #[StringType, Max(64), Regex('/^[a-z][a-z0-9_]*$/')]
        public Optional|string $code = new Optional(),

        #[StringType]
        public Optional|string $type = new Optional(),

        #[StringType]
        public Optional|string $widget = new Optional(),

        public Optional|array|null $widgetConfig = new Optional(),

        public Optional|array|null $validation = new Optional(),

        public Optional|array $labels = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        public Optional|bool $isDeprecated = new Optional(),

        #[StringType]
        public Optional|string|null $deprecatedAt = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
