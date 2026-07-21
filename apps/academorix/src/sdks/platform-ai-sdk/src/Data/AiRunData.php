<?php

declare(strict_types=1);

namespace Stackra\PlatformAiSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AiRun}.
 *
 * Mirrors `schemas/ai-run.schema.json` column-for-column, minus
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
 * $row = app(PlatformSdk::class)->ai()->aiRuns()->show($id);
 * ```
 *
 * @category AiSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AiRunData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $persona
     * @param  string                       $provider                   openai / anthropic / gemini / groq / xai / ollama.
     * @param  string                       $model
     * @param  string                       $promptHash                 SHA-256 of the prompt payload for reproducibility.
     * @param  string                       $status                     RunStatus enum: running → succeeded / failed / cancelled / rate_limited.
     * @param  string                       $startedAt
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $conversationId
     * @param  ?string                      $responseHash
     * @param  ?string                      $completedAt
     * @param  ?int                         $latencyMs
     * @param  ?int                         $tokensIn
     * @param  ?int                         $tokensOut
     * @param  ?int                         $costMinor
     * @param  ?string                      $errorMessage
     * @param  array<string, mixed>|null    $metadata
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $persona,
        public string $provider,
        public string $model,
        public string $promptHash,
        public string $status,
        public string $startedAt,
        public string $createdAt,
        public string $updatedAt,
        public ?string $conversationId = null,
        public ?string $responseHash = null,
        public ?string $completedAt = null,
        public ?int $latencyMs = null,
        public ?int $tokensIn = null,
        public ?int $tokensOut = null,
        public ?int $costMinor = null,
        public ?string $errorMessage = null,
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
