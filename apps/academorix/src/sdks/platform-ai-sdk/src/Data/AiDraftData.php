<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AiDraft}.
 *
 * Mirrors `schemas/ai-draft.schema.json` column-for-column, minus
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
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->ai()->aiDrafts()->show($id);
 * ```
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AiDraftData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $aiRunId
     * @param  string                       $aiToolCallId
     * @param  string                       $userId
     * @param  string                       $persona                    FQCN of the persona that produced the draft.
     * @param  string                       $toolName                   Tool that produced the draft.
     * @param  string                       $actionClass                FQCN of the domain Action that will run on confirm.
     * @param  array<string, mixed>         $actionPayload              The full payload to hand the Action.
     * @param  string                       $preview                    Human-readable preview shown to the reviewer.
     * @param  string                       $status                     open / confirmed / expired / discarded (DraftStatus enum).
     * @param  string                       $expiresAt                  TTL for confirmation.
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $confirmedAt
     * @param  ?string                      $confirmedByUserId
     * @param  ?string                      $discardedAt
     * @param  ?string                      $discardedByUserId
     * @param  ?string                      $discardedReason
     * @param  ?string                      $resultSummary              Post-confirm summary of what the Action returned.
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $createdBy
     * @param  ?string                      $updatedBy
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $aiRunId,
        public string $aiToolCallId,
        public string $userId,
        public string $persona,
        public string $toolName,
        public string $actionClass,
        public array $actionPayload,
        public string $preview,
        public string $status,
        public string $expiresAt,
        public string $createdAt,
        public string $updatedAt,
        public ?string $confirmedAt = null,
        public ?string $confirmedByUserId = null,
        public ?string $discardedAt = null,
        public ?string $discardedByUserId = null,
        public ?string $discardedReason = null,
        public ?string $resultSummary = null,
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
