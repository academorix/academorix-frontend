<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\FormVersion}.
 *
 * Mirrors `schemas/form-version.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Platform service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->forms()->formVersions()->show($id);
 * ```
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class FormVersionData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $formId
     * @param  int                          $versionNumber              Monotonic per-form.
     * @param  string                       $status                     draft / published / superseded / archived.
     * @param  array<string, mixed>         $schema                     The form schema.
     * @param  array<string, mixed>         $labels                     Locale bundle.
     * @param  int                          $fieldCount
     * @param  int                          $submissionCount            Number of completed submissions against this version.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $validationRules            Cross-field + form-level validation rules (e.
     * @param  ?string                      $publishedAt
     * @param  ?string                      $publishedByUserId
     * @param  ?string                      $supersededAt
     * @param  ?string                      $supersededByVersionId
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $formId,
        public int $versionNumber,
        public string $status,
        public array $schema,
        public array $labels,
        public int $fieldCount,
        public int $submissionCount,
        public string $createdAt,
        public string $updatedAt,
        public ?array $validationRules = null,
        public ?string $publishedAt = null,
        public ?string $publishedByUserId = null,
        public ?string $supersededAt = null,
        public ?string $supersededByVersionId = null,
        public ?array $metadata = null,
        public ?string $createdBy = null,
        public ?string $updatedBy = null,
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
