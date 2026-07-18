<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Platform\Timezones;

use Academorix\Authorization\Attributes\RequirePermission;
use Academorix\Geography\Contracts\Data\TimezoneInterface;
use Academorix\Geography\Contracts\Repositories\TimezoneRepositoryInterface;
use Academorix\Geography\Data\Requests\CreateTimezoneRequestData;
use Academorix\Geography\Data\Resources\TimezoneResourceData;
use Academorix\Geography\Enums\GeographyPermission;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Attributes\Post;
use Academorix\Routing\Concerns\AsController;

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
