<?php

declare(strict_types=1);

namespace Stackra\Search\Data;

use Stackra\Search\Contracts\Data\SearchAnalyticsEventInterface;
use Stackra\Search\Models\SearchAnalyticsEvent;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SearchAnalyticsEvent}.
 *
 * Raw `query` text is NEVER emitted on the wire — only `query_hash`
 * is aggregation-safe.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SearchAnalyticsEventData extends Data
{
    /**
     * @param  list<string>|null  $indexNames
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public ?string $userId,
        public string $kind,
        public string $engine,
        public ?array $indexNames,
        public ?string $queryHash,
        public ?int $resultCount,
        public ?int $tookMs,
        public bool $hadTypoCorrection,
        public bool $wasFromSavedQuery,
        public ?string $clickedResultType,
        public ?string $clickedResultId,
        public ?int $clickedPosition,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
    ) {
    }

    public static function fromModel(SearchAnalyticsEvent $row): self
    {
        return new self(
            id: (string) $row->getKey(),
            tenantId: self::nullableString($row, SearchAnalyticsEventInterface::ATTR_TENANT_ID),
            userId: self::nullableString($row, SearchAnalyticsEventInterface::ATTR_USER_ID),
            kind: (string) $row->{SearchAnalyticsEventInterface::ATTR_KIND}?->value,
            engine: (string) $row->{SearchAnalyticsEventInterface::ATTR_ENGINE}?->value,
            indexNames: $row->{SearchAnalyticsEventInterface::ATTR_INDEX_NAMES},
            queryHash: self::nullableString($row, SearchAnalyticsEventInterface::ATTR_QUERY_HASH),
            resultCount: $row->{SearchAnalyticsEventInterface::ATTR_RESULT_COUNT},
            tookMs: $row->{SearchAnalyticsEventInterface::ATTR_TOOK_MS},
            hadTypoCorrection: (bool) $row->{SearchAnalyticsEventInterface::ATTR_HAD_TYPO_CORRECTION},
            wasFromSavedQuery: (bool) $row->{SearchAnalyticsEventInterface::ATTR_WAS_FROM_SAVED_QUERY},
            clickedResultType: self::nullableString($row, SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_TYPE),
            clickedResultId: self::nullableString($row, SearchAnalyticsEventInterface::ATTR_CLICKED_RESULT_ID),
            clickedPosition: $row->{SearchAnalyticsEventInterface::ATTR_CLICKED_POSITION},
            createdAt: $row->{SearchAnalyticsEventInterface::ATTR_CREATED_AT},
        );
    }

    private static function nullableString(SearchAnalyticsEvent $row, string $key): ?string
    {
        $value = $row->{$key} ?? null;

        return $value === null || $value === '' ? null : (string) $value;
    }
}
