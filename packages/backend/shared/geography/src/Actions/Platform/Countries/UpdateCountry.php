<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Countries;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Stackra\Geography\Data\Requests\UpdateCountryRequestData;
use Stackra\Geography\Data\Resources\CountryResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Geography\Models\Country;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Patch;
use Stackra\Routing\Concerns\AsController;

/**
 * `PATCH /api/v1/platform/geography/countries/{country}` — platform
 * admin updates a country row.
 *
 * Only fields the caller sent are updated. `Spatie\LaravelData\Optional`
 * on the request DTO opts unset fields out of mass-assignment.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.countries.update')]
#[Patch('/api/v1/platform/geography/countries/{country}')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class UpdateCountry
{
    use AsController;

    public function __construct(
        private readonly CountryRepositoryInterface $countries,
    ) {
    }

    public function __invoke(Country $country, UpdateCountryRequestData $data): CountryResourceData
    {
        // Spatie's `toArray()` drops every `Optional`-typed unset
        // field, so mass-assignment sees only what the caller sent.
        $updates = $data->toArray();

        $updated = $this->countries->update((string) $country->getKey(), $updates);

        return CountryResourceData::fromModel($updated);
    }
}
