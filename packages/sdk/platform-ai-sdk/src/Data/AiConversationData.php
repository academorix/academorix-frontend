<?php

declare(strict_types=1);

namespace Academorix\PlatformAiSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AiConversation}.
 *
 * Mirrors `schemas/ai-conversation.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Platform service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Academorix\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->ai()->aiConversations()->show($id);
 * ```
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AiConversationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $userId
     * @param  string                       $persona                    CoachAssistant / ParentAssistant / AdminAssistant / MedicalAssistant / …
     * @param  string                       $status
     * @param  int                          $messageCount
     * @param  int                          $totalCostMinor
     * @param  int                          $totalTokensIn
     * @param  int                          $totalTokensOut
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $title
     * @param  ?string                      $lastMessageAt
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $userId,
        public string $persona,
        public string $status,
        public int $messageCount,
        public int $totalCostMinor,
        public int $totalTokensIn,
        public int $totalTokensOut,
        public string $createdAt,
        public string $updatedAt,
        public ?string $title = null,
        public ?string $lastMessageAt = null,
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
