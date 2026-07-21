<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\GradingEvent}.
 *
 * Mirrors `schemas/grading-event.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Sports service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->progress()->gradingEvents()->show($id);
 * ```
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class GradingEventData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $branchId
     * @param  string                       $sportKey
     * @param  string                       $name
     * @param  string                       $scheduledAt
     * @param  string                       $examinerCoachId
     * @param  string                       $status                     scheduled / in_progress / completed / cancelled.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $completedAt
     * @param  ?string                      $venueFacilityId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $branchId,
        public string $sportKey,
        public string $name,
        public string $scheduledAt,
        public string $examinerCoachId,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $completedAt = null,
        public ?string $venueFacilityId = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
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
