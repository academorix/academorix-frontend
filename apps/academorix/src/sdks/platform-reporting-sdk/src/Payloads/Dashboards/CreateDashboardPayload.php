<?php

declare(strict_types=1);

namespace Academorix\PlatformReportingSdk\Payloads\Dashboards;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/dashboards` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category ReportingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateDashboardPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $ownerUserId
     * @param  string                       $name
     * @param  array                        $layout
     * @param  array                        $widgets                    Array of {key, saved_report_id?, definition_id?, kind, config, position}.
     * @param  string                       $audienceScope
     * @param  ?string                      $description
     * @param  ?string                      $sharedWithRole
     * @param  ?string                      $lastSnapshotAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $ownerUserId,

        #[StringType]
        public string $name,

        public array $layout,

        public array $widgets,

        #[StringType]
        public string $audienceScope,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $sharedWithRole = null,

        #[StringType]
        public ?string $lastSnapshotAt = null,

        public ?array $metadata = null,
    ) {
    }
}
