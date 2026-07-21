<?php

declare(strict_types=1);

namespace Stackra\SharedAttributesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Stackra\Attributes\Models\AttributeGroup}.
 *
 * Mirrors `schemas/attribute-group.schema.json` column-for-column, minus
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
 * $row = app(SharedSdk::class)->attributes()->attributeGroups()->show($id);
 * ```
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AttributeGroupData extends Data
{
    /**
     * @param  string                       $id                         Prefixed ULID: `atg_<26>`.
     * @param  string                       $tenantId
     * @param  string                       $attributeSetId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  array<string, mixed>         $labels
     * @param  int                          $sortOrder
     * @param  bool                         $isCollapsible
     * @param  bool                         $isCollapsedDefault
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $icon                       Optional icon key for the UI.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $attributeSetId,
        public string $code,
        public array $labels,
        public int $sortOrder,
        public bool $isCollapsible,
        public bool $isCollapsedDefault,
        public string $createdAt,
        public string $updatedAt,
        public ?string $icon = null,
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
