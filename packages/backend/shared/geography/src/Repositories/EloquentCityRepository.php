<?php

declare(strict_types=1);

namespace Stackra\Geography\Repositories;

use Stackra\Crud\Attributes\AsRepository;
use Stackra\Crud\Attributes\Cacheable;
use Stackra\Crud\Attributes\Filterable;
use Stackra\Crud\Attributes\UseModel;
use Stackra\Crud\Repositories\Repository;
use Stackra\Geography\Contracts\Data\CityInterface;
use Stackra\Geography\Contracts\Repositories\CityRepositoryInterface;
use Stackra\Geography\Exceptions\GeographyCitiesIndexUnscopedException;
use Stackra\Geography\Models\City;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see CityRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — 1-hour TTL. Cache warming
 * skips cities (150k rows) — cold miss is acceptable.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(CityInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    CityInterface::ATTR_COUNTRY_ID   => ['$eq', '$in'],
    CityInterface::ATTR_STATE_ID     => ['$eq', '$in'],
    CityInterface::ATTR_COUNTRY_CODE => ['$eq', '$in'],
    CityInterface::ATTR_STATE_CODE   => ['$eq', '$in'],
    CityInterface::ATTR_NAME         => ['$eq', '$contains'],
])]
final class EloquentCityRepository extends Repository implements CityRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByCountry(int $countryId): Collection
    {
        /** @var Collection<int, City> $rows */
        $rows = $this->query()
            ->where(CityInterface::ATTR_COUNTRY_ID, $countryId)
            ->orderBy(CityInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByState(int $stateId): Collection
    {
        /** @var Collection<int, City> $rows */
        $rows = $this->query()
            ->where(CityInterface::ATTR_STATE_ID, $stateId)
            ->orderBy(CityInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function refuseUnscopedIndex(): void
    {
        // Refuse a full-table scan across ~150k rows. The action
        // calls this before delegating to the query builder so
        // unscoped 422s never reach the DB.
        throw new GeographyCitiesIndexUnscopedException(
            'The cities index requires a `filter[country_id]` or `filter[state_id]` parameter.',
        );
    }
}
