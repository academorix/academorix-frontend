<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\ReportDefinition}.
 *
 * Mirrors `schemas/report-definition.schema.json` column-for-column, minus
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
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->reporting()->reportDefinitions()->show($id);
 * ```
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ReportDefinitionData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $code                       attendance_by_branch / revenue_monthly / retention_cohort / roster.
     * @param  string                       $name
     * @param  string                       $kind                       attendance / revenue / retention / roster / performance / financial / custom.
     * @param  array<string, mixed>         $outputColumns
     * @param  string                       $audienceScope
     * @param  bool                         $isSystem
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $tenantId
     * @param  ?string                      $description
     * @param  array<string, mixed>|null    $parametersSchema           JSON schema for the run parameters.
     * @param  ?string                      $sqlTemplateHash            SHA-256 of the versioned SQL template.
     * @param  ?string                      $refreshCadence
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $code,
        public string $name,
        public string $kind,
        public array $outputColumns,
        public string $audienceScope,
        public bool $isSystem,
        public string $createdAt,
        public string $updatedAt,
        public ?string $tenantId = null,
        public ?string $description = null,
        public ?array $parametersSchema = null,
        public ?string $sqlTemplateHash = null,
        public ?string $refreshCadence = null,
        public ?array $metadata = null,
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
