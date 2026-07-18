<?php

declare(strict_types=1);

namespace Academorix\Geography\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Geography\Contracts\Data\CountryInterface;
use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Models\Country;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see CountryRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — 1-hour TTL with tag-based
 * invalidation. Observer flushes tags on every write (rare — vendor
 * seeder is source of truth).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(CountryInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    CountryInterface::ATTR_ISO2      => ['$eq', '$in'],
    CountryInterface::ATTR_ISO3      => ['$eq', '$in'],
    CountryInterface::ATTR_NAME      => ['$eq', '$contains'],
    CountryInterface::ATTR_REGION    => ['$eq', '$in'],
    CountryInterface::ATTR_SUBREGION => ['$eq', '$in'],
    CountryInterface::ATTR_STATUS    => ['$eq'],
])]
final class EloquentCountryRepository extends Repository implements CountryRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByIso2(string $iso2): ?Country
    {
        /** @var Country|null $row */
        $row = $this->query()
            ->where(CountryInterface::ATTR_ISO2, \strtoupper($iso2))
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByIso3(string $iso3): ?Country
    {
        /** @var Country|null $row */
        $row = $this->query()
            ->where(CountryInterface::ATTR_ISO3, \strtoupper($iso3))
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function findByRegion(string $region): Collection
    {
        /** @var Collection<int, Country> $rows */
        $rows = $this->query()
            ->where(CountryInterface::ATTR_REGION, $region)
            ->orderBy(CountryInterface::ATTR_NAME)
            ->get();

        return $rows;
    }
}
