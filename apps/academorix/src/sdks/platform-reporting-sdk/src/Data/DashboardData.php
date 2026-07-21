<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Dashboard}.
 *
 * Mirrors `schemas/dashboard.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->reporting()->dashboards()->show($id);
 * ```
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class DashboardData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $ownerUserId
     * @param  string                       $name
     * @param  array<string, mixed>         $layout
     * @param  array<string, mixed>         $widgets                    Array of {key, saved_report_id?, definition_id?, kind, config, position}.
     * @param  string                       $audienceScope
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $description
     * @param  ?string                      $sharedWithRole
     * @param  ?string                      $lastSnapshotAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $ownerUserId,
        public string $name,
        public array $layout,
        public array $widgets,
        public string $audienceScope,
        public string $createdAt,
        public string $updatedAt,
        public ?string $description = null,
        public ?string $sharedWithRole = null,
        public ?string $lastSnapshotAt = null,
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
