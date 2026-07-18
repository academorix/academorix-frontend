<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Cities;

use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Models\City;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

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
