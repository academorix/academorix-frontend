<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\CountryInterface;
use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Stackra\Geography\Data\Requests\CreateCountryRequestData;
use Stackra\Geography\Data\Resources\CountryResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

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
