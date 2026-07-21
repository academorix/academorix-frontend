<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\ReportRun}.
 *
 * Mirrors `schemas/report-run.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->reporting()->reportRuns()->show($id);
 * ```
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ReportRunData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $reportDefinitionId
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $savedReportId
     * @param  ?string                      $requestedByUserId
     * @param  array<string, mixed>|null    $parameters
     * @param  ?string                      $startedAt
     * @param  ?string                      $completedAt
     * @param  ?int                         $rowsCount
     * @param  ?string                      $outputDocumentId
     * @param  ?string                      $errorMessage
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $reportDefinitionId,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $savedReportId = null,
        public ?string $requestedByUserId = null,
        public ?array $parameters = null,
        public ?string $startedAt = null,
        public ?string $completedAt = null,
        public ?int $rowsCount = null,
        public ?string $outputDocumentId = null,
        public ?string $errorMessage = null,
        public ?array $metadata = null,
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
