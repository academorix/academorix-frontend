<?php

declare(strict_types=1);

namespace Academorix\Geography\Actions\Timezones;

use Academorix\Geography\Data\Resources\TimezoneResourceData;
use Academorix\Geography\Models\Timezone;
use Academorix\Routing\Attributes\AsAction;
use Academorix\Routing\Attributes\Get;
use Academorix\Routing\Attributes\Middleware;
use Academorix\Routing\Concerns\AsController;

/**
 * `GET /api/v1/geography/timezones/{timezone}` — public timezone show.
 * Route binding accepts numeric PK OR the URL-encoded IANA name.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsAction(name: 'geography.timezones.show')]
#[Get('/api/v1/geography/timezones/{timezone}')]
#[Middleware(['api', 'world.locale', 'geography.cache'])]
final class ShowTimezone
{
    use AsController;

    public function __invoke(Timezone $timezone): TimezoneResourceData
    {
        return TimezoneResourceData::fromModel($timezone);
    }
}
