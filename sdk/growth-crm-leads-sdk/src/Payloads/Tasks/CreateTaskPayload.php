<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Payloads\Tasks;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/tasks` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateTaskPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $assigneeUserId
     * @param  string                       $title
     * @param  string                       $kind
     * @param  string                       $status
     * @param  string                       $priority
     * @param  ?string                      $leadId
     * @param  ?string                      $description
     * @param  ?string                      $dueAt
     * @param  ?string                      $completedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $assigneeUserId,

        #[StringType]
        public string $title,

        #[StringType]
        public string $kind,

        #[StringType]
        public string $status,

        #[StringType]
        public string $priority,

        #[StringType]
        public ?string $leadId = null,

        #[StringType]
        public ?string $description = null,

        #[StringType]
        public ?string $dueAt = null,

        #[StringType]
        public ?string $completedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
