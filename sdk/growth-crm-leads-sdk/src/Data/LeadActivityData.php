<?php

declare(strict_types=1);

namespace Academorix\GrowthCrmLeadsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\LeadActivity}.
 *
 * Mirrors `schemas/lead-activity.schema.json` column-for-column, minus
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
 * $row = app(GrowthSdk::class)->crmLeads()->leadActivities()->show($id);
 * ```
 *
 * @category CrmLeadsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class LeadActivityData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $leadId
     * @param  string                       $userId
     * @param  string                       $kind                       call / email / sms / note / meeting / demo / stage_change.
     * @param  string                       $occurredAt
     * @param  string                       $description
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $outcome                    left_voicemail / no_answer / talked / interested / not_interested.
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $leadId,
        public string $userId,
        public string $kind,
        public string $occurredAt,
        public string $description,
        public string $createdAt,
        public string $updatedAt,
        public ?string $outcome = null,
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
