<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk\Payloads\MedicalClearances;

use Spatie\LaravelData\Attributes\MapName;
use Spatie\LaravelData\Attributes\Validation\StringType;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible write payload for `POST /api/v1/medical-clearances` (or the
 * tenant-scoped equivalent).
 *
 * Every non-nullable property is auto-required by spatie/laravel-data;
 * every nullable defaults to `null`. Snake_case bridge in both
 * directions — the DTO's `toArray()` emits snake_case for the wire,
 * and Spatie validation kicks in during construction.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
#[MapName(SnakeCaseMapper::class)]
final class CreateMedicalClearancePayload extends Data
{
    /**
     * @param  string                       $tenantId
     * @param  string                       $athleteId
     * @param  string                       $issuedAt
     * @param  string                       $expiresAt
     * @param  string                       $issuedByUserId
     * @param  string                       $scope
     * @param  ?array                       $restrictions               When scope=limited — array of restriction descriptors (no_contact / no_heading / no_running_more_than_20m / …).
     * @param  ?string                      $documentId
     * @param  ?string                      $notesEncrypted
     * @param  ?array                       $metadata
     */
    public function __construct(
        #[StringType]
        public string $tenantId,

        #[StringType]
        public string $athleteId,

        #[StringType]
        public string $issuedAt,

        #[StringType]
        public string $expiresAt,

        #[StringType]
        public string $issuedByUserId,

        #[StringType]
        public string $scope,

        public ?array $restrictions = null,

        #[StringType]
        public ?string $documentId = null,

        #[StringType]
        public ?string $notesEncrypted = null,

        public ?array $metadata = null,
    ) {
    }
}
