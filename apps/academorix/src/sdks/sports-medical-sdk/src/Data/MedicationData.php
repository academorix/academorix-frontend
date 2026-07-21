<?php

declare(strict_types=1);

namespace Stackra\SportsMedicalSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\Medication}.
 *
 * Mirrors `schemas/medication.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Sports service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\SportsSdk\Client\SportsSdk;
 *
 * $row = app(SportsSdk::class)->medical()->medications()->show($id);
 * ```
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class MedicationData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $nameEncrypted
     * @param  string                       $status
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $dosageEncrypted
     * @param  ?string                      $frequency
     * @param  ?string                      $prescribingProviderEncrypted
     * @param  ?string                      $startedAt
     * @param  ?string                      $expiresAt
     * @param  ?string                      $notesEncrypted
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $athleteId,
        public string $nameEncrypted,
        public string $status,
        public string $createdAt,
        public string $updatedAt,
        public ?string $dosageEncrypted = null,
        public ?string $frequency = null,
        public ?string $prescribingProviderEncrypted = null,
        public ?string $startedAt = null,
        public ?string $expiresAt = null,
        public ?string $notesEncrypted = null,
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
