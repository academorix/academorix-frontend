<?php

declare(strict_types=1);

namespace Stackra\Geography\Actions\Platform\Timezones;

use Stackra\Authorization\Attributes\RequirePermission;
use Stackra\Geography\Contracts\Data\TimezoneInterface;
use Stackra\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Stackra\Geography\Data\Requests\CreateTimezoneRequestData;
use Stackra\Geography\Data\Resources\TimezoneResourceData;
use Stackra\Geography\Enums\GeographyPermission;
use Stackra\Routing\Attributes\AsAction;
use Stackra\Routing\Attributes\Middleware;
use Stackra\Routing\Attributes\Post;
use Stackra\Routing\Concerns\AsController;

/**
 * `POST /api/v1/platform/geography/timezones` — platform admin
 * creates a timezone row. The observer validates the IANA name.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.platform.timezones.create')]
#[Post('/api/v1/platform/geography/timezones')]
#[Middleware(['api', 'auth:platform_admin', 'throttle:foundation-platform', 'world.locale'])]
#[RequirePermission(GeographyPermission::PlatformManage)]
final class CreateTimezone
{
    use AsController;

    public function __construct(
        private readonly TimezoneRepositoryInterface $timezones,
    ) {
    }

    public function __invoke(CreateTimezoneRequestData $data): TimezoneResourceData
    {
        $timezone = $this->timezones->create([
            TimezoneInterface::ATTR_COUNTRY_ID   => $data->countryId,
            TimezoneInterface::ATTR_NAME         => $data->name,
            TimezoneInterface::ATTR_COUNTRY_CODE => $data->countryCode,
        ]);

        return TimezoneResourceData::fromModel($timezone);
    }
}
