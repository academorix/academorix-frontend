<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Countries;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\CountryInterface;
use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateCountryRequestData;
use Academorix\Geography\Data\Resources\CountryResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/countries` — platform admin
 * creates a country row.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.countries.create')]
#[Post('/api/v1/platform/geography/countries')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateCountry
{
    use AsController;

    public function __construct(
        private readonly CountryRepositoryInterface $countries,
    ) {
    }

    public function __invoke(CreateCountryRequestData $data): CountryResourceData
    {
        $country = $this->countries->create([
            CountryInterface::ATTR_ISO2       => $data->iso2,
            CountryInterface::ATTR_ISO3       => $data->iso3,
            CountryInterface::ATTR_NAME       => $data->name,
            CountryInterface::ATTR_NATIVE     => $data->native,
            CountryInterface::ATTR_PHONE_CODE => $data->phoneCode,
            CountryInterface::ATTR_REGION     => $data->region,
            CountryInterface::ATTR_SUBREGION  => $data->subregion,
            CountryInterface::ATTR_LATITUDE   => $data->latitude,
            CountryInterface::ATTR_LONGITUDE  => $data->longitude,
            CountryInterface::ATTR_EMOJI      => $data->emoji,
            CountryInterface::ATTR_EMOJI_U    => $data->emojiU,
            CountryInterface::ATTR_STATUS     => $data->status,
        ]);

        return CountryResourceData::fromModel($country);
    }
}
