<?php

declare(strict_types=1);

namespace Stackra\SportsRegistrationsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\RegistrationActivity}.
 *
 * Mirrors `schemas/registration-activity.schema.json` column-for-column, minus
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
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->registrations()->registrationActivities()->show($id);
 * ```
 *
 * @category RegistrationsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class RegistrationActivityData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $registrationId
     * @param  string                       $kind                       call / email / sms / note / visit / stage_change / task_created / task_completed / offer_made / offer_accepted / offer_d...
     * @param  string                       $occurredAt                 When the activity happened — may differ from created_at (e.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $actorUserId                The user who performed the activity.
     * @param  ?string                      $body                       Free-form activity body.
     * @param  array<string, mixed>|null    $context                    Kind-specific structured data.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $registrationId,
        public string $kind,
        public string $occurredAt,
        public string $createdAt,
        public string $updatedAt,
        public ?string $actorUserId = null,
        public ?string $body = null,
        public ?array $context = null,
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
