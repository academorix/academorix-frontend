<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Countries;

use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Models\City;
use Academorix\Geography\Models\Country;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/countries/{country}/cities` — cities scoped
 * to one country. Bypasses the unscoped-index refusal in the
 * repository — country scope IS present here.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.countries.cities.list')]
#[Get('/api/v1/geography/countries/{country}/cities')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListCitiesForCountry
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    /**
     * @return DataCollection<int, CityResourceData>
     */
    public function __invoke(Country $country): DataCollection
    {
        $rows = $this->cities->findByCountry((int) $country->getKey())
            ->map(static fn (City $c): CityResourceData => CityResourceData::fromModel($c));

        return new DataCollection(CityResourceData::class, $rows);
    }
}
