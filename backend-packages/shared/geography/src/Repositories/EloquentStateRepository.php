<?php

declare(strict_types=1);

namespace Academorix\Geography\Repositories;

use Academorix\Crud\Attributes\AsRepository;
use Academorix\Crud\Attributes\Cacheable;
use Academorix\Crud\Attributes\Filterable;
use Academorix\Crud\Attributes\UseModel;
use Academorix\Crud\Repositories\Repository;
use Academorix\Geography\Contracts\Data\StateInterface;
use Academorix\Geography\Contracts\Repositories\StateRepositoryInterface;
use Academorix\Geography\Exceptions\GeographyStatesIndexUnscopedException;
use Academorix\Geography\Models\State;
use Illuminate\Support\Collection;

/**
 * Eloquent implementation of {@see StateRepositoryInterface}.
 *
 * ## Cache strategy
 *
 * `#[Cacheable(ttl: 3600, tags: true)]` — 1-hour TTL. Observer
 * flushes tags on every write.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsRepository]
#[UseModel(StateInterface::class)]
#[Cacheable(ttl: 3600, tags: true)]
#[Filterable([
    StateInterface::ATTR_COUNTRY_ID   => ['$eq', '$in'],
    StateInterface::ATTR_COUNTRY_CODE => ['$eq', '$in'],
    StateInterface::ATTR_STATE_CODE   => ['$eq', '$in'],
    StateInterface::ATTR_NAME         => ['$eq', '$contains'],
    StateInterface::ATTR_TYPE         => ['$eq', '$in'],
])]
final class EloquentStateRepository extends Repository implements StateRepositoryInterface
{
    /**
     * {@inheritDoc}
     */
    public function findByCountry(int $countryId): Collection
    {
        /** @var Collection<int, State> $rows */
        $rows = $this->query()
            ->where(StateInterface::ATTR_COUNTRY_ID, $countryId)
            ->orderBy(StateInterface::ATTR_NAME)
            ->get();

        return $rows;
    }

    /**
     * {@inheritDoc}
     */
    public function findByStateCode(int $countryId, string $stateCode): ?State
    {
        /** @var State|null $row */
        $row = $this->query()
            ->where(StateInterface::ATTR_COUNTRY_ID, $countryId)
            ->where(StateInterface::ATTR_STATE_CODE, $stateCode)
            ->first();

        return $row;
    }

    /**
     * {@inheritDoc}
     */
    public function refuseUnscopedIndex(): void
    {
        // Refuse a full-table scan across ~5000 rows without a
        // country scope. The action calls this before delegating to
        // the query-builder pipeline so unscoped 422s never reach the
        // DB.
        throw new GeographyStatesIndexUnscopedException(
            'The states index requires a `filter[country_id]` parameter.',
        );
    }
}
