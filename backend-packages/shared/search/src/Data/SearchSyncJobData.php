<?php

declare(strict_types=1);

namespace Academorix\Search\Data;

use Academorix\Search\Contracts\Data\SearchSyncJobInterface;
use Academorix\Search\Models\SearchSyncJob;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SearchSyncJob}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SearchSyncJobData extends Data
{
    /**
     * @param  array<string, int>|null  $counters
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $searchIndexId,
        public string $kind,
        public string $status,
        public string $source,
        public int $shardsTotal,
        public int $shardsCompleted,
        public int $progressPercent,
        public ?array $counters,
        public ?string $causerType,
        public ?string $causerId,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $startedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $finishedAt,
        public ?string $lastErrorCode,
        public ?string $lastErrorMessage,
    ) {
    }

    public static function fromModel(SearchSyncJob $job): self
    {
        return new self(
            id: (string) $job->getKey(),
            tenantId: self::nullableString($job, SearchSyncJobInterface::ATTR_TENANT_ID),
            searchIndexId: (string) $job->{SearchSyncJobInterface::ATTR_SEARCH_INDEX_ID},
            kind: (string) $job->{SearchSyncJobInterface::ATTR_KIND},
            status: (string) $job->{SearchSyncJobInterface::ATTR_STATUS}?->value,
            source: (string) $job->{SearchSyncJobInterface::ATTR_SOURCE},
            shardsTotal: (int) $job->{SearchSyncJobInterface::ATTR_SHARDS_TOTAL},
            shardsCompleted: (int) $job->{SearchSyncJobInterface::ATTR_SHARDS_COMPLETED},
            progressPercent: (int) $job->{SearchSyncJobInterface::ATTR_PROGRESS_PERCENT},
            counters: $job->{SearchSyncJobInterface::ATTR_COUNTERS},
            causerType: self::nullableString($job, SearchSyncJobInterface::ATTR_CAUSER_TYPE),
            causerId: self::nullableString($job, SearchSyncJobInterface::ATTR_CAUSER_ID),
            startedAt: $job->{SearchSyncJobInterface::ATTR_STARTED_AT},
            finishedAt: $job->{SearchSyncJobInterface::ATTR_FINISHED_AT},
            lastErrorCode: self::nullableString($job, SearchSyncJobInterface::ATTR_LAST_ERROR_CODE),
            lastErrorMessage: self::nullableString($job, SearchSyncJobInterface::ATTR_LAST_ERROR_MESSAGE),
        );
    }

    private static function nullableString(SearchSyncJob $job, string $key): ?string
    {
        $value = $job->{$key} ?? null;

        return $value === null || $value === '' ? null : (string) $value;
    }
}
