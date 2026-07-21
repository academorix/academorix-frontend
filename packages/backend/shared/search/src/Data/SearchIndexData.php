<?php

declare(strict_types=1);

namespace Stackra\Search\Data;

use Stackra\Search\Contracts\Data\SearchIndexInterface;
use Stackra\Search\Models\SearchIndex;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SearchIndex}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SearchIndexData extends Data
{
    /**
     * @param  list<string>|null          $fieldSpecs
     * @param  list<string>|null          $facetSpecs
     * @param  list<string>|null          $boostSpecs
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $modelClass,
        public string $engine,
        public string $indexName,
        public string $liveAlias,
        public int $currentVersion,
        public string $status,
        public ?string $language,
        public int $documentCount,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastIndexedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastSwapAt,
        public ?array $fieldSpecs,
        public ?array $facetSpecs,
        public ?array $boostSpecs,
        public ?string $configHash,
        public string $retentionTier,
    ) {
    }

    public static function fromModel(SearchIndex $index): self
    {
        return new self(
            id: (string) $index->getKey(),
            tenantId: self::nullableString($index, SearchIndexInterface::ATTR_TENANT_ID),
            modelClass: (string) $index->{SearchIndexInterface::ATTR_MODEL_CLASS},
            engine: (string) $index->{SearchIndexInterface::ATTR_ENGINE}?->value,
            indexName: (string) $index->{SearchIndexInterface::ATTR_INDEX_NAME},
            liveAlias: (string) $index->{SearchIndexInterface::ATTR_LIVE_ALIAS},
            currentVersion: (int) $index->{SearchIndexInterface::ATTR_CURRENT_VERSION},
            status: (string) $index->{SearchIndexInterface::ATTR_STATUS}?->value,
            language: self::nullableString($index, SearchIndexInterface::ATTR_LANGUAGE),
            documentCount: (int) $index->{SearchIndexInterface::ATTR_DOCUMENT_COUNT},
            lastIndexedAt: $index->{SearchIndexInterface::ATTR_LAST_INDEXED_AT},
            lastSwapAt: $index->{SearchIndexInterface::ATTR_LAST_SWAP_AT},
            fieldSpecs: $index->{SearchIndexInterface::ATTR_FIELD_SPECS},
            facetSpecs: $index->{SearchIndexInterface::ATTR_FACET_SPECS},
            boostSpecs: $index->{SearchIndexInterface::ATTR_BOOST_SPECS},
            configHash: self::nullableString($index, SearchIndexInterface::ATTR_CONFIG_HASH),
            retentionTier: (string) $index->{SearchIndexInterface::ATTR_RETENTION_TIER},
        );
    }

    private static function nullableString(SearchIndex $index, string $key): ?string
    {
        $value = $index->{$key} ?? null;

        return $value === null || $value === '' ? null : (string) $value;
    }
}
