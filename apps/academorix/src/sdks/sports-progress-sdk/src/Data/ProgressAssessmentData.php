<?php

declare(strict_types=1);

namespace Stackra\SportsProgressSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\ProgressAssessment}.
 *
 * Mirrors `schemas/progress-assessment.schema.json` column-for-column, minus
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
 * $row = app(SportsSdk::class)->progress()->progressAssessments()->show($id);
 * ```
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ProgressAssessmentData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteEnrollmentId
     * @param  string                       $captureDate
     * @param  string                       $assessedAt
     * @param  string                       $assessedByUserId
     * @param  array<string, mixed>         $values                     Attribute values keyed by definition code.
     * @param  string                       $attributeSetSnapshotId     The AttributeSet version this assessment was captured against.
     * @param  string                       $sportKey                   Denormalised from athlete_enrollment.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $overallScore               Computed weighted overall (0-100 typical range).
     * @param  ?string                      $overallTier                bronze / silver / gold / diamond.
     * @param  ?string                      $notes
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteEnrollmentId,
        public string $captureDate,
        public string $assessedAt,
        public string $assessedByUserId,
        public array $values,
        public string $attributeSetSnapshotId,
        public string $sportKey,
        public string $createdAt,
        public string $updatedAt,
        public ?string $overallScore = null,
        public ?string $overallTier = null,
        public ?string $notes = null,
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
