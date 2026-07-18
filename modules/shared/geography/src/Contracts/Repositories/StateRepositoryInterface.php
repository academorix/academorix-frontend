<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\State;
use Academorix\Geography\Repositories\EloquentStateRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see State}.
 *
 * Refuses unscoped `index()` reads without a `country_id` filter to
 * prevent full-table scans across ~5000 rows.
 *
 * @extends RepositoryInterface<State>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentStateRepository::class)]
interface StateRepositoryInterface extends RepositoryInterface
{
    /**
     * Every state within a country, ordered by name.
     *
     * @param  int  $countryId  Country primary key.
     * @return Collection<int, State>
     */
    public function findByCountry(int $countryId): Collection;

    /**
     * Look up a state by its ISO-3166-2 state_code within a country.
     *
     * @param  int     $countryId  Country primary key.
     * @param  string  $stateCode  ISO-3166-2 sub-code (e.g. `CA` for California).
     * @return State|null
     */
    public function findByStateCode(int $countryId, string $stateCode): ?State;

    /**
     * Refuse listing states without a country scope. Called by the
     * public `list` action; throws when the request has no
     * `filter[country_id]=`.
     *
     * @throws \Academorix\Geography\Exceptions\GeographyStatesIndexUnscopedException
     */
    public function refuseUnscopedIndex(): void;
}
