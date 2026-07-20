<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\States;

use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Models\City;
use Academorix\Geography\Models\State;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;
use Spatie\LaravelData\DataCollection;

/**
 * `GET /api/v1/geography/states/{state}/cities` — cities scoped to
 * one state.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.states.cities.list')]
#[Get('/api/v1/geography/states/{state}/cities')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ListCitiesForState
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    /**
     * @return DataCollection<int, CityResourceData>
     */
    public function __invoke(State $state): DataCollection
    {
        $rows = $this->cities->findByState((int) $state->getKey())
            ->map(static fn (City $c): CityResourceData => CityResourceData::fromModel($c));

        return new DataCollection(CityResourceData::class, $rows);
    }
}
