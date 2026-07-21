<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Cities;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\CityInterface;
use Stackra\Geography\Contracts\Repositories\CityRepositoryInterface;
use Stackra\Geography\Data\Requests\CreateCityRequestData;
use Stackra\Geography\Data\Resources\CityResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
