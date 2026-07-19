<?php

declare(strict_types=1);

namespace Academorix\NotificationsMessagingSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Conversation}.
 *
 * Mirrors `schemas/conversation.schema.json` column-for-column, minus
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
 * $row = app(NotificationsSdk::class)->messaging()->conversations()->show($id);
 * ```
 *
 * @category MessagingSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ConversationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $scope                      adhoc / branch / team.
     * @param  bool                         $isGroup
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $scopeRefId
     * @param  ?string                      $subject
     * @param  ?string                      $lastMessageAt
     * @param  ?string                      $archivedAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $scope,
        public bool $isGroup,
        public string $createdAt,
        public string $updatedAt,
        public ?string $scopeRefId = null,
        public ?string $subject = null,
        public ?string $lastMessageAt = null,
        public ?string $archivedAt = null,
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
