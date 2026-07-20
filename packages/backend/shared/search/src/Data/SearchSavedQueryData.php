<?php

declare(strict_types=1);

namespace Academorix\Search\Data;

use Academorix\Search\Contracts\Data\SearchSavedQueryInterface;
use Academorix\Search\Models\SearchSavedQuery;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see SearchSavedQuery}.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class SearchSavedQueryData extends Data
{
    /**
     * @param  list<string>|null           $across
     * @param  array<string, mixed>|null   $filters
     * @param  array<string, mixed>|null   $facets
     * @param  array<string, mixed>|null   $boosts
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public string $ownerId,
        public string $name,
        public ?string $description,
        public ?array $across,
        public ?string $query,
        public ?array $filters,
        public ?array $facets,
        public ?array $boosts,
        public bool $isShared,
        public bool $isSmartList,
        public int $useCount,
        public ?int $lastResultCount,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $lastRunAt,
    ) {
    }

    public static function fromModel(SearchSavedQuery $row): self
    {
        return new self(
            id: (string) $row->getKey(),
            tenantId: (string) $row->{SearchSavedQueryInterface::ATTR_TENANT_ID},
            ownerId: (string) $row->{SearchSavedQueryInterface::ATTR_OWNER_ID},
            name: (string) $row->{SearchSavedQueryInterface::ATTR_NAME},
            description: self::nullableString($row, SearchSavedQueryInterface::ATTR_DESCRIPTION),
            across: $row->{SearchSavedQueryInterface::ATTR_ACROSS},
            query: self::nullableString($row, SearchSavedQueryInterface::ATTR_QUERY),
            filters: $row->{SearchSavedQueryInterface::ATTR_FILTERS},
            facets: $row->{SearchSavedQueryInterface::ATTR_FACETS},
            boosts: $row->{SearchSavedQueryInterface::ATTR_BOOSTS},
            isShared: (bool) $row->{SearchSavedQueryInterface::ATTR_IS_SHARED},
            isSmartList: (bool) $row->{SearchSavedQueryInterface::ATTR_IS_SMART_LIST},
            useCount: (int) $row->{SearchSavedQueryInterface::ATTR_USE_COUNT},
            lastResultCount: $row->{SearchSavedQueryInterface::ATTR_LAST_RESULT_COUNT},
            lastRunAt: $row->{SearchSavedQueryInterface::ATTR_LAST_RUN_AT},
        );
    }

    private static function nullableString(SearchSavedQuery $row, string $key): ?string
    {
        $value = $row->{$key} ?? null;

        return $value === null || $value === '' ? null : (string) $value;
    }
}
