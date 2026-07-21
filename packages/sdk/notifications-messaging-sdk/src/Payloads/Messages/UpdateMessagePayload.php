<?php

declare(strict_types=1);

namespace Stackra\NotificationsMessagingSdk\Payloads\Messages;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/messages/{id}` (or the
 * tenant-scoped equivalent).
 *
 * Partial-update semantics — every property is typed
 * `T|Optional|null` with an `Optional` sentinel default. Spatie
 * Data's `toArray()` strips `Optional` values, so unmentioned fields
 * are never emitted (never clear server-side state). Pass `null`
 * explicitly to clear a nullable column.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class UpdateMessagePayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $conversationId
     * @param  Optional|string                  $senderUserId
     * @param  Optional|string|null             $body                       NULL when message is attachment-only.
     * @param  Optional|array|null              $attachments                Array of {file_id, kind, size} pointing at storage::File.
     * @param  Optional|array|null              $readBy                     Map user_id → read_at timestamp.
     * @param  Optional|string|null             $replyToMessageId
     * @param  Optional|string|null             $editedAt
     * @param  Optional|string                  $sentAt
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $conversationId = new Optional(),

        #[StringType]
        public Optional|string $senderUserId = new Optional(),

        #[StringType]
        public Optional|string|null $body = new Optional(),

        public Optional|array|null $attachments = new Optional(),

        public Optional|array|null $readBy = new Optional(),

        #[StringType]
        public Optional|string|null $replyToMessageId = new Optional(),

        #[StringType]
        public Optional|string|null $editedAt = new Optional(),

        #[StringType]
        public Optional|string $sentAt = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
