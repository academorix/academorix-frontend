<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Cities;

use Stackra\Geography\Data\Resources\CityResourceData;
use Stackra\Geography\Models\City;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Get;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/cities/{city}` — public city show.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.cities.show')]
#[Get('/api/v1/geography/cities/{city}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowCity
{
    use AsController;

    public function __invoke(City $city): CityResourceData
    {
        return CityResourceData::fromModel($city);
    }
}
