<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Countries;

use Academorix\Geography\Data\Resources\CountryResourceData;
use Academorix\Geography\Models\Country;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/countries/{country}` — public single country
 * lookup. Route binding accepts numeric PK OR ISO-3166 alpha-2.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.countries.show')]
#[Get('/api/v1/geography/countries/{country}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowCountry
{
    use AsController;

    public function __invoke(Country $country): CountryResourceData
    {
        return CountryResourceData::fromModel($country);
    }
}
