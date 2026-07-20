<?php

declare(strict_types=1);

namespace Academorix\PlatformAiSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AiEmbedding}.
 *
 * Mirrors `schemas/ai-embedding.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->ai()->aiEmbeddings()->show($id);
 * ```
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AiEmbeddingData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $sourceType                 drill / coach_note / progress_assessment / file / conversation_message.
     * @param  string                       $sourceId
     * @param  string                       $vector                     pgvector column, 1536 dims (openai-3) or 3072 dims (openai-3-large).
     * @param  string                       $model
     * @param  string                       $textContentHash
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $sourceType,
        public string $sourceId,
        public string $vector,
        public string $model,
        public string $textContentHash,
        public string $createdAt,
        public string $updatedAt,
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
