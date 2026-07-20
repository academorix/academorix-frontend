<?php

declare(strict_types=1);

namespace Academorix\SportsProgressSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\ProgressCard}.
 *
 * Mirrors `schemas/progress-card.schema.json` column-for-column, minus
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
 * use Academorix\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->progress()->progressCards()->show($id);
 * ```
 *
 * @category ProgressSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ProgressCardData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $progressAssessmentId
     * @param  string                       $cardType                   fifa_card / attribute_card / radar / time_trial / apparatus_scores.
     * @param  string                       $renderedAt
     * @param  int                          $shareViews
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $renderedDocumentId         PDF / PNG render via storage module.
     * @param  ?string                      $shareSignature
     * @param  ?string                      $shareExpiresAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $progressAssessmentId,
        public string $cardType,
        public string $renderedAt,
        public int $shareViews,
        public string $createdAt,
        public string $updatedAt,
        public ?string $renderedDocumentId = null,
        public ?string $shareSignature = null,
        public ?string $shareExpiresAt = null,
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
