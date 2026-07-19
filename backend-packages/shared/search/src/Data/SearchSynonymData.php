<?php

declare(strict_types=1);

namespace Academorix\Search\Data;

use Academorix\Search\Contracts\Data\SearchSynonymInterface;
use Academorix\Search\Models\SearchSynonym;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SearchSynonym}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SearchSynonymData extends Data
{
    /**
     * @param  list<string>|null  $terms
     * @param  list<string>|null  $oneWayTargets
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public ?string $searchIndexId,
        public string $language,
        public string $kind,
        public ?array $terms,
        public ?string $oneWaySource,
        public ?array $oneWayTargets,
        public bool $isActive,
        public bool $isSystem,
        public string $source,
        public ?string $description,
    ) {
    }

    public static function fromModel(SearchSynonym $row): self
    {
        return new self(
            id: (string) $row->getKey(),
            tenantId: self::nullableString($row, SearchSynonymInterface::ATTR_TENANT_ID),
            searchIndexId: self::nullableString($row, SearchSynonymInterface::ATTR_SEARCH_INDEX_ID),
            language: (string) $row->{SearchSynonymInterface::ATTR_LANGUAGE},
            kind: (string) $row->{SearchSynonymInterface::ATTR_KIND}?->value,
            terms: $row->{SearchSynonymInterface::ATTR_TERMS},
            oneWaySource: self::nullableString($row, SearchSynonymInterface::ATTR_ONE_WAY_SOURCE),
            oneWayTargets: $row->{SearchSynonymInterface::ATTR_ONE_WAY_TARGETS},
            isActive: (bool) $row->{SearchSynonymInterface::ATTR_IS_ACTIVE},
            isSystem: (bool) $row->{SearchSynonymInterface::ATTR_IS_SYSTEM},
            source: (string) $row->{SearchSynonymInterface::ATTR_SOURCE},
            description: self::nullableString($row, SearchSynonymInterface::ATTR_DESCRIPTION),
        );
    }

    private static function nullableString(SearchSynonym $row, string $key): ?string
    {
        $value = $row->{$key} ?? null;

        return $value === null || $value === '' ? null : (string) $value;
    }
}
