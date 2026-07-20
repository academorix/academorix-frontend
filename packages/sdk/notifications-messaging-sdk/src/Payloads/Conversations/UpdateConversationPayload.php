<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Payloads\Conversations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;
use Spatie\LaravelData\Optional;

/**
 * Wire-visible write payload for `PATCH /api/v1/conversations/{id}` (or the
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
final class UpdateConversationPayload extends Data
{
    /**
     * @param  Optional|string                  $tenantId
     * @param  Optional|string                  $scope                      adhoc / branch / team.
     * @param  Optional|string|null             $scopeRefId
     * @param  Optional|string|null             $subject
     * @param  Optional|bool                    $isGroup
     * @param  Optional|string|null             $lastMessageAt
     * @param  Optional|string|null             $archivedAt
     * @param  Optional|array|null              $metadata
     */
    public function __construct(
        #[StringType]
        public Optional|string $tenantId = new Optional(),

        #[StringType]
        public Optional|string $scope = new Optional(),

        #[StringType]
        public Optional|string|null $scopeRefId = new Optional(),

        #[StringType]
        public Optional|string|null $subject = new Optional(),

        public Optional|bool $isGroup = new Optional(),

        #[StringType]
        public Optional|string|null $lastMessageAt = new Optional(),

        #[StringType]
        public Optional|string|null $archivedAt = new Optional(),

        public Optional|array|null $metadata = new Optional(),
    ) {
    }
}
