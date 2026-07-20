<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AnnouncementView}.
 *
 * Mirrors `schemas/announcement-view.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Notifications service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\NotificationsSdk\Client\NotificationsSdk;
 *
 * $row = app(NotificationsSdk::class)->announcements()->announcementViews()->show($id);
 * ```
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AnnouncementViewData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $announcementId
     * @param  string                       $userId
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $readAt
     * @param  ?string                      $acknowledgedAt
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $announcementId,
        public string $userId,
        public string $createdAt,
        public string $updatedAt,
        public ?string $readAt = null,
        public ?string $acknowledgedAt = null,
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
