<?php

declare(strict_types=1);

namespace Academorix\SharedAttributesSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Academorix\Attributes\Models\AttributeSet}.
 *
 * Mirrors `schemas/attribute-set.schema.json` column-for-column, minus
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
 * use Academorix\SharedSdk\Client\SharedSdk;
 *
 * $row = app(SharedSdk::class)->attributes()->attributeSets()->show($id);
 * ```
 *
 * @category AttributesSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AttributeSetData extends Data
{
    /**
     * @param  string                       $id                         Prefixed ULID: `asg_<26>`.
     * @param  string                       $tenantId
     * @param  string                       $code                       Machine identifier — snake_case.
     * @param  string                       $entityType                 Canonical host entity (athlete_enrollment, progress_assessment, performance_test_result).
     * @param  string                       $discriminatorField         Host column carrying the discriminator (sport_key, program_key).
     * @param  string                       $discriminatorValue         Value that selects this set (football, swimming, karate, generic).
     * @param  int                          $versionNumber              Monotonic version — bumped on breaking change.
     * @param  string                       $status                     draft / active / superseded / archived.
     * @param  bool                         $isActive                   Active flag — one active set per (entity_type, discriminator_value) at any time.
     * @param  array<string, mixed>         $labels
     * @param  array<string, mixed>         $definitionOrder            Ordered array of {group_id, definition_id, sort_order}.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $activatedAt
     * @param  ?string                      $deactivatedAt
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
        public string $entityType,
        public string $discriminatorField,
        public string $discriminatorValue,
        public int $versionNumber,
        public string $status,
        public bool $isActive,
        public array $labels,
        public array $definitionOrder,
        public string $createdAt,
        public string $updatedAt,
        public ?string $activatedAt = null,
        public ?string $deactivatedAt = null,
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
