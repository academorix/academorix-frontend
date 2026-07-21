<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Payloads\Announcements;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/announcements` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateAnnouncementPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $title
     * @param  string                       $body
     * @param  string                       $audienceScope              tenant / organization / branch / team / role.
     * @param  string                       $status
     * @param  string                       $authoredByUserId
     * @param  bool                         $requiresAcknowledgement
     * @param  string                       $priority
     * @param  ?string                      $audienceRefId              The organization/branch/team ID when scope is not 'tenant'.
     * @param  ?string                      $audienceRole               When scope='role' — the role key.
     * @param  ?string                      $publishAt
     * @param  ?string                      $expiresAt
     * @param  ?array                       $attachments
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $title,

        #[StringType]
        public string $body,

        #[StringType]
        public string $audienceScope,

        #[StringType]
        public string $status,

        #[StringType]
        public string $authoredByUserId,

        public bool $requiresAcknowledgement,

        #[StringType]
        public string $priority,

        #[StringType]
        public ?string $audienceRefId = null,

        #[StringType]
        public ?string $audienceRole = null,

        #[StringType]
        public ?string $publishAt = null,

        #[StringType]
        public ?string $expiresAt = null,

        public ?array $attachments = null,

        public ?array $metadata = null,
    ) {
    }
}
