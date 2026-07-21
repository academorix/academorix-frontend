<?php

declare(strict_types=1);

namespace Stackra\Geography\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Geography\Contracts\Data\CountryInterface;
use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Stackra\Geography\Models\Country;
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
