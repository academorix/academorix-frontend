<?php

declare(strict_types=1);

namespace Stackra\PlatformReportingSdk\Payloads\Dashboards;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/dashboards/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateDashboardPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $ownerUserId
     * @param  Optional|string                  $name
     * @param  Optional|string|null             $description
     * @param  Optional|array                   $layout
     * @param  Optional|array                   $widgets                    Array of {key, saved_report_id?, definition_id?, kind, config, position}.
     * @param  Optional|string                  $audienceScope
     * @param  Optional|string|null             $sharedWithRole
     * @param  Optional|string|null             $lastSnapshotAt
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $ownerUserId = new Optional(),

        #[StringType]
        public Optional|string $name = new Optional(),

        #[StringType]
        public Optional|string|null $description = new Optional(),

        public Optional|array $layout = new Optional(),

        public Optional|array $widgets = new Optional(),

        #[StringType]
        public Optional|string $audienceScope = new Optional(),

        #[StringType]
        public Optional|string|null $sharedWithRole = new Optional(),

        #[StringType]
        public Optional|string|null $lastSnapshotAt = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
