<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Countries;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Repositories\CountryRepositoryInterface;
use Academorix\Geography\Data\Requests\UpdateCountryRequestData;
use Academorix\Geography\Data\Resources\CountryResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Geography\Models\Country;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Patch;
use Academorix\Routing\Concerns\AsController;

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
