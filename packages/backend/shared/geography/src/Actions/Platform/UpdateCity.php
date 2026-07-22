<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\CityRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateCityRequestData;
use Stackra\Geography\Data\Resources\CityResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\City;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/cities/{city}` — platform admin
 * updates a city row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.cities.update')]
#[Patch('/api/v1/platform/geography/cities/{city}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateCity
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    public function __invoke(City $city, UpdateCityRequestData $data): CityResourceData
    {
        $updated = $this->cities->update((string) $city->getKey(), $data->toArray());

        return CityResourceData::fromModel($updated);
    }
}
