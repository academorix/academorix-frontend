<?php

declare(strict_types=1);

namespace Academorix\Transfer\Data;

use Academorix\Transfer\Contracts\Data\XferJobInterface;
use Academorix\Transfer\Models\XferJob;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see XferJob}.
 *
 * Restricted-tier columns (`source_file_hash`, `checksum_sha256`)
 * are omitted here — the model already hides them, and the DTO
 * doesn't reference them.
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class XferJobData extends Data
{
    /**
     * @param  string                     $id             Prefixed ULID `xjb_<26>`.
     * @param  string|null                $tenantId       Owning tenant id.
     * @param  string                     $kind           `import` | `export` | `sample`.
     * @param  string                     $entityKey      Entity registry key.
     * @param  string|null                $format         File format if applicable.
     * @param  string|null                $mode           Import mode (import only).
     * @param  string                     $status         Lifecycle state.
     * @param  string|null                $initiatorUserId The user who initiated the job.
     * @param  array<string, int>|null    $counters       Rolled-up counters.
     * @param  \DateTimeInterface         $createdAt      Row creation.
     * @param  \DateTimeInterface|null    $startedAt      Transition to running.
     * @param  \DateTimeInterface|null    $completedAt    Transition to a terminal state.
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $kind,
        public string $entityKey,
        public ?string $format,
        public ?string $mode,
        public string $status,
        public ?string $initiatorUserId,
        public ?array $counters,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $startedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $completedAt = null,
    ) {
    }

    /**
     * Build the DTO from a model.
     */
    public static function fromModel(XferJob $job): self
    {
        return new self(
            id: (string) $job->getKey(),
            tenantId: self::nullableString($job, XferJobInterface::ATTR_TENANT_ID),
            kind: (string) $job->{XferJobInterface::ATTR_KIND}?->value,
            entityKey: (string) $job->{XferJobInterface::ATTR_ENTITY_KEY},
            format: $job->{XferJobInterface::ATTR_FORMAT}?->value,
            mode: $job->{XferJobInterface::ATTR_MODE}?->value,
            status: (string) $job->{XferJobInterface::ATTR_STATUS}?->value,
            initiatorUserId: self::nullableString($job, XferJobInterface::ATTR_INITIATOR_USER_ID),
            counters: self::arrayOrNull($job, XferJobInterface::ATTR_COUNTERS),
            createdAt: $job->{XferJobInterface::ATTR_CREATED_AT},
            startedAt: $job->{XferJobInterface::ATTR_STARTED_AT},
            completedAt: $job->{XferJobInterface::ATTR_COMPLETED_AT},
        );
    }

    /**
     * Read a nullable string attribute; empty strings collapse to null.
     */
    private static function nullableString(XferJob $job, string $key): ?string
    {
        $value = $job->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Read an array attribute, returning `null` for missing values.
     *
     * @return array<string, int>|null
     */
    private static function arrayOrNull(XferJob $job, string $key): ?array
    {
        $value = $job->{$key} ?? null;

        return \is_array($value) ? $value : null;
    }
}
