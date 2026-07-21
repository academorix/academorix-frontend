<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Stackra\Attributes\Models\AttributeDefinition}.
 *
 * Mirrors `schemas/attribute-definition.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Shared service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\SharedSdk\Client\SharedSdk;
 *
 * $row = app(SharedSdk::class)->attributes()->attributeDefinitions()->show($id);
 * ```
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AttributeDefinitionData extends Data
{
    /**
     * @param  string                       $id                         Prefixed ULID: `ads_<26>`.
     * @param  string                       $tenantId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  string                       $type                       Enum: integer / decimal / select / boolean / date / text / slider / percentage.
     * @param  string                       $widget                     Rendering hint: select / slider / number / date / input / switch / textarea / radio.
     * @param  array<string, mixed>         $labels                     Bilingual labels: {en: 'Pace', ar: 'السرعة'}.
     * @param  bool                         $isDeprecated               When true — hidden from new sets but preserved for historic rendering.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $widgetConfig               Widget-specific config: {min, max, step, options[], placeholder, .
     * @param  array<string, mixed>|null    $validation                 Validation rules: {required, min, max, pattern, options[], nullable}.
     * @param  ?string                      $description                Long-form field description shown in help text.
     * @param  ?string                      $deprecatedAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $code,
        public string $type,
        public string $widget,
        public array $labels,
        public bool $isDeprecated,
        public string $createdAt,
        public string $updatedAt,
        public ?array $widgetConfig = null,
        public ?array $validation = null,
        public ?string $description = null,
        public ?string $deprecatedAt = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
        public ?string $deletedBy = null,
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
