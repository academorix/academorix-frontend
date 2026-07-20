<?php

declare(strict_types=1);

namespace Academorix\NotificationsAnnouncementsSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Announcement}.
 *
 * Mirrors `schemas/announcement.schema.json` column-for-column, minus
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
 * $row = app(NotificationsSdk::class)->announcements()->announcements()->show($id);
 * ```
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AnnouncementData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $title
     * @param  string                       $body
     * @param  string                       $audienceScope              tenant / organization / branch / team / role.
     * @param  string                       $status
     * @param  string                       $authoredByUserId
     * @param  bool                         $requiresAcknowledgement
     * @param  string                       $priority
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $audienceRefId              The organization/branch/team ID when scope is not 'tenant'.
     * @param  ?string                      $audienceRole               When scope='role' — the role key.
     * @param  ?string                      $publishAt
     * @param  ?string                      $expiresAt
     * @param  array<string, mixed>|null    $attachments
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $title,
        public string $body,
        public string $audienceScope,
        public string $status,
        public string $authoredByUserId,
        public bool $requiresAcknowledgement,
        public string $priority,
        public string $createdAt,
        public string $updatedAt,
        public ?string $audienceRefId = null,
        public ?string $audienceRole = null,
        public ?string $publishAt = null,
        public ?string $expiresAt = null,
        public ?array $attachments = null,
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
