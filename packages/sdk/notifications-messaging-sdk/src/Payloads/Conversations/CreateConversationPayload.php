<?php

declare(strict_types=1);

namespace Stackra\NotificationsMessagingSdk\Payloads\Conversations;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/conversations` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateConversationPayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $scope                      adhoc / branch / team.
     * @param  bool                         $isGroup
     * @param  ?string                      $scopeRefId
     * @param  ?string                      $subject
     * @param  ?string                      $lastMessageAt
     * @param  ?string                      $archivedAt
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $scope,

        public bool $isGroup,

        #[StringType]
        public ?string $scopeRefId = null,

        #[StringType]
        public ?string $subject = null,

        #[StringType]
        public ?string $lastMessageAt = null,

        #[StringType]
        public ?string $archivedAt = null,

        public ?array $metadata = null,
    ) {
    }
}
