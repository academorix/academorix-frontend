<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Cities;

use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Models\City;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Illuminate\Http\Request;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/cities` — requires `?filter[country_id]=` OR
 * `?filter[state_id]=` to avoid a full-table scan across ~150k rows.
 *
 * Refused via {@see CityRepositoryInterface::refuseUnscopedIndex()}
 * when the filter is missing.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.cities.list')]
#[Get('/api/v1/geography/cities')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListCities
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    /**
     * @return DataCollection<int, CityResourceData>
     */
    public function __invoke(Request $request): DataCollection
    {
        $countryId = $request->query('filter.country_id');
        $stateId   = $request->query('filter.state_id');

        if ($countryId === null && $stateId === null) {
            $this->cities->refuseUnscopedIndex();
        }

        $rows = $stateId !== null
            ? $this->cities->findByState((int) $stateId)
            : $this->cities->findByCountry((int) $countryId);

        $mapped = $rows->map(
            static fn (City $c): CityResourceData => CityResourceData::fromModel($c),
        );

        return new DataCollection(CityResourceData::class, $mapped);
    }
}
