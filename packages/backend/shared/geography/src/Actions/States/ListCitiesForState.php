<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\States;

use Stackra\Geography\Contracts\Repositories\CityRepositoryInterface;
use Stackra\Geography\Data\Resources\CityResourceData;
use Stackra\Geography\Models\City;
use Stackra\Geography\Models\State;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;
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
