<?php

declare(strict_types=1);

namespace Stackra\NotificationsAnnouncementsSdk\Payloads\Announcements;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/announcements/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category AnnouncementsSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateAnnouncementPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $title
     * @param  Optional|string                  $body
     * @param  Optional|string                  $audienceScope              tenant / organization / branch / team / role.
     * @param  Optional|string|null             $audienceRefId              The organization/branch/team ID when scope is not 'tenant'.
     * @param  Optional|string|null             $audienceRole               When scope='role' — the role key.
     * @param  Optional|string|null             $publishAt
     * @param  Optional|string|null             $expiresAt
     * @param  Optional|string                  $status
     * @param  Optional|string                  $authoredByUserId
     * @param  Optional|bool                    $requiresAcknowledgement
     * @param  Optional|string                  $priority
     * @param  Optional|array|null              $attachments
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $title = new Optional(),

        #[StringType]
        public Optional|string $body = new Optional(),

        #[StringType]
        public Optional|string $audienceScope = new Optional(),

        #[StringType]
        public Optional|string|null $audienceRefId = new Optional(),

        #[StringType]
        public Optional|string|null $audienceRole = new Optional(),

        #[StringType]
        public Optional|string|null $publishAt = new Optional(),

        #[StringType]
        public Optional|string|null $expiresAt = new Optional(),

        #[StringType]
        public Optional|string $status = new Optional(),

        #[StringType]
        public Optional|string $authoredByUserId = new Optional(),

        public Optional|bool $requiresAcknowledgement = new Optional(),

        #[StringType]
        public Optional|string $priority = new Optional(),

        public Optional|array|null $attachments = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
