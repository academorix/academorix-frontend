<?php

declare(strict_types=1);

namespace Academorix\Geography\Contracts\Repositories;

use Academorix\Crud\Contracts\RepositoryInterface;
use Academorix\Geography\Models\City;
use Academorix\Geography\Repositories\EloquentCityRepository;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Support\Collection;

/**
 * Repository contract for {@see City}.
 *
 * Refuses unscoped `index()` reads without `country_id` OR `state_id`
 * filter to prevent full-table scans across ~150k rows.
 *
 * @extends RepositoryInterface<City>
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[Bind(EloquentCityRepository::class)]
interface CityRepositoryInterface extends RepositoryInterface
{
    /**
     * Every city within a country.
     *
     * @param  int  $countryId  Country primary key.
     * @return Collection<int, City>
     */
    public function findByCountry(int $countryId): Collection;

    /**
     * Every city within a state.
     *
     * @param  int  $stateId  State primary key.
     * @return Collection<int, City>
     */
    public function findByState(int $stateId): Collection;

    /**
     * Refuse listing cities without a country OR state scope. Called
     * by the public `list` action; throws when the request has no
     * `filter[country_id]=` or `filter[state_id]=`.
     *
     * @throws \Academorix\Geography\Exceptions\GeographyCitiesIndexUnscopedException
     */
    public function refuseUnscopedIndex(): void;
}
