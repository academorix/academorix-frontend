<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Task}.
 *
 * Mirrors `schemas/task.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Growth service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\GrowthSdk\Client\GrowthSdk;
 *
 * $row = app(GrowthSdk::class)->crmLeads()->tasks()->show($id);
 * ```
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class TaskData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $assigneeUserId
     * @param  string                       $title
     * @param  string                       $kind
     * @param  string                       $status
     * @param  string                       $priority
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $leadId
     * @param  ?string                      $description
     * @param  ?string                      $dueAt
     * @param  ?string                      $completedAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $assigneeUserId,
        public string $title,
        public string $kind,
        public string $status,
        public string $priority,
        public string $createdAt,
        public string $updatedAt,
        public ?string $leadId = null,
        public ?string $description = null,
        public ?string $dueAt = null,
        public ?string $completedAt = null,
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
