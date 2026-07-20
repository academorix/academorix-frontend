<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Cities;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateCityRequestData;
use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\City;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
