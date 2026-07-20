<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Cities;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\CityInterface;
use Academorix\Geography\Contracts\Repositories\CityRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateCityRequestData;
use Academorix\Geography\Data\Resources\CityResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/cities` — platform admin creates a
 * city row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.cities.create')]
#[Post('/api/v1/platform/geography/cities')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateCity
{
    use AsController;

    public function __construct(
        private readonly CityRepositoryInterface $cities,
    ) {
    }

    public function __invoke(CreateCityRequestData $data): CityResourceData
    {
        $city = $this->cities->create([
            CityInterface::ATTR_COUNTRY_ID   => $data->countryId,
            CityInterface::ATTR_STATE_ID     => $data->stateId,
            CityInterface::ATTR_NAME         => $data->name,
            CityInterface::ATTR_COUNTRY_CODE => $data->countryCode,
            CityInterface::ATTR_STATE_CODE   => $data->stateCode,
            CityInterface::ATTR_LATITUDE     => $data->latitude,
            CityInterface::ATTR_LONGITUDE    => $data->longitude,
        ]);

        return CityResourceData::fromModel($city);
    }
}
